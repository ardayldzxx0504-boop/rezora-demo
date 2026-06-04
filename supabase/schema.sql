-- =============================================================
--  Rezora — Supabase Schema
--  Çalıştırma: Supabase Dashboard → SQL Editor → bu dosyayı yapıştır → Run
--  İçerik: tablolar + Row Level Security + süre bazlı çakışma trigger'ı
--          + availability RPC + örnek (seed) veri
-- =============================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------
-- TABLES
-- ----------------------------------------------------------------
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null default 'business' check (role in ('admin','business')),
  business_id uuid,
  full_name   text,
  email       text,
  created_at  timestamptz default now()
);

create table if not exists businesses (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid references auth.users(id) on delete set null,
  name          text not null,
  category      text not null default 'barber' check (category in ('barber','salon')),
  category_name text not null default 'Berber',
  city          text,
  area          text,
  phone         text,
  working_days  int[] not null default '{1,2,3,4,5,6}',
  open_time     text not null default '10:00',
  close_time    text not null default '20:00',
  slot_minutes  int  not null default 30,
  rating        numeric default 5.0,
  reviews       int default 0,
  img           text,
  gallery       text[],
  description   text,
  apply_note    text,          -- başvuru sırasında işletmenin admin'e notu
  status        text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at    timestamptz default now()
);

create table if not exists services (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  name         text not null,
  duration_min int  not null default 30,
  price        numeric,          -- NULL ise müşteriye "Fiyatı sor" gösterilir
  popular      boolean default false,
  created_at   timestamptz default now()
);

create table if not exists reservations (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references businesses(id) on delete cascade,
  service_id     uuid references services(id) on delete set null,
  service_name   text,
  duration_min   int not null default 30,
  price          numeric,
  date           date not null,
  time           text not null,      -- "HH:MM"
  customer_name  text not null,
  customer_phone text not null,
  note           text,
  status         text not null default 'pending' check (status in ('pending','approved','rejected','completed')),
  created_at     timestamptz default now()
);

create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  reservation_id  uuid references reservations(id) on delete cascade,
  business_id     uuid references businesses(id) on delete cascade,
  to_phone        text,
  channel         text default 'whatsapp',
  type            text,   -- created | approved | rejected | completed
  text            text,
  status          text default 'pending' check (status in ('pending','sent','failed')),
  sent_at         timestamptz default now()
);

-- ----------------------------------------------------------------
-- MIGRATIONS (idempotent — mevcut tablolar için güvenli)
-- ----------------------------------------------------------------
alter table public.businesses add column if not exists apply_note text;

-- ----------------------------------------------------------------
-- HELPER FUNCTIONS (security definer => RLS özyinelemesini önler)
-- ----------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

create or replace function public.owns_business(bid uuid)
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.businesses b where b.id = bid and b.owner_id = auth.uid());
$$;

create or replace function public.time_to_min(t text)
returns int language sql immutable as $$
  select (split_part(t, ':', 1))::int * 60 + (split_part(t, ':', 2))::int;
$$;

-- ----------------------------------------------------------------
-- DURATION-BASED OVERLAP GUARD (Öncelik 3)
--  30 dk'lık 10:00 randevusu varsa 10:15 reddedilir.
-- ----------------------------------------------------------------
create or replace function public.check_reservation_overlap()
returns trigger language plpgsql security definer set search_path = public as $$
declare ns int; ne int;
begin
  if NEW.status = 'rejected' then return NEW; end if;
  ns := public.time_to_min(NEW.time);
  ne := ns + coalesce(NEW.duration_min, 30);
  if exists (
    select 1 from public.reservations r
    where r.business_id = NEW.business_id
      and r.date = NEW.date
      and r.id <> NEW.id
      and r.status in ('pending','approved','completed')
      and ns < (public.time_to_min(r.time) + coalesce(r.duration_min, 30))
      and public.time_to_min(r.time) < ne
  ) then
    raise exception 'SLOT_CONFLICT';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_reservation_overlap on public.reservations;
create trigger trg_reservation_overlap
  before insert or update on public.reservations
  for each row execute function public.check_reservation_overlap();

-- ----------------------------------------------------------------
-- AVAILABILITY RPC (anon müşteri PII görmeden dolu aralıkları öğrenir)
-- ----------------------------------------------------------------
create or replace function public.taken_slots(bid uuid, d date)
returns table (t text, dur int)
language sql security definer stable as $$
  select time, duration_min from public.reservations
  where business_id = bid and date = d and status in ('pending','approved','completed');
$$;
grant execute on function public.taken_slots(uuid, date) to anon, authenticated;

-- new reservation id helper (istemci uuid üretebilsin diye opsiyonel)
-- (istemci tarafında crypto.randomUUID kullanıyoruz)

-- ----------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.businesses   enable row level security;
alter table public.services     enable row level security;
alter table public.reservations enable row level security;
alter table public.messages     enable row level security;

-- profiles
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert with check (id = auth.uid());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update using (id = auth.uid() or public.is_admin());

-- businesses
drop policy if exists biz_select on public.businesses;
create policy biz_select on public.businesses for select
  using (status = 'approved' or owner_id = auth.uid() or public.is_admin());
drop policy if exists biz_insert on public.businesses;
create policy biz_insert on public.businesses for insert
  with check (owner_id = auth.uid() or public.is_admin());
drop policy if exists biz_update on public.businesses;
create policy biz_update on public.businesses for update
  using (owner_id = auth.uid() or public.is_admin());
drop policy if exists biz_delete on public.businesses;
create policy biz_delete on public.businesses for delete using (public.is_admin());

-- services
drop policy if exists svc_select on public.services;
create policy svc_select on public.services for select using (
  exists (select 1 from public.businesses b
          where b.id = services.business_id
            and (b.status = 'approved' or b.owner_id = auth.uid() or public.is_admin()))
);
drop policy if exists svc_write on public.services;
create policy svc_write on public.services for all
  using (public.owns_business(business_id) or public.is_admin())
  with check (public.owns_business(business_id) or public.is_admin());

-- reservations
drop policy if exists res_insert on public.reservations;
create policy res_insert on public.reservations for insert with check (
  exists (select 1 from public.businesses b where b.id = business_id and b.status = 'approved')
);
drop policy if exists res_select on public.reservations;
create policy res_select on public.reservations for select using (public.owns_business(business_id) or public.is_admin());
drop policy if exists res_update on public.reservations;
create policy res_update on public.reservations for update using (public.owns_business(business_id) or public.is_admin());

-- messages
drop policy if exists msg_insert on public.messages;
create policy msg_insert on public.messages for insert with check (true);
drop policy if exists msg_select on public.messages;
create policy msg_select on public.messages for select using (public.owns_business(business_id) or public.is_admin());
drop policy if exists msg_update on public.messages;
create policy msg_update on public.messages for update using (public.owns_business(business_id) or public.is_admin());

-- ----------------------------------------------------------------
-- REALTIME (dashboard'da rezervasyon/mesaj canlı güncellensin)
--  Tabloları supabase_realtime yayınına ekler. RLS realtime'da da uygulanır,
--  yani işletme yalnızca kendi business_id kayıtlarını dinler.
-- ----------------------------------------------------------------
alter table public.reservations replica identity full;
alter table public.messages     replica identity full;
do $$
begin
  begin alter publication supabase_realtime add table public.reservations; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.messages;     exception when duplicate_object then null; end;
end $$;

-- ----------------------------------------------------------------
-- SEED DATA (3 demo işletme — sahipsiz, onaylı, admin tarafından yönetilir)
-- ----------------------------------------------------------------
insert into public.businesses (id, name, category, category_name, city, area, phone, working_days, open_time, close_time, slot_minutes, rating, reviews, img, gallery, description, status)
values
 ('00000000-0000-0000-0000-000000000001','Elite Barber','barber','Berber','Girne','Karaoğlanoğlu Cd. No:14','+90 533 812 00 14','{1,2,3,4,5,6}','10:00','20:00',30,4.9,312,'1503951914875-452162b0f3f1',
   array['1503951914875-452162b0f3f1','1585747860715-2ba37e788b70','1599351431202-1e0f0137899a','1521490878406-8d3d05fd2f33','1605497788044-5a32c7078486'],
   'Girne''nin kalbinde, modern erkek bakımını sanatla buluşturan butik bir berber.','approved'),
 ('00000000-0000-0000-0000-000000000002','Modern Kuaför','salon','Kuaför','Lefkoşa','Dereboyu Cd. No:42','+90 533 277 00 42','{1,2,3,4,5,6}','09:30','19:30',30,4.8,204,'1560066984-138dadb4c035',
   array['1560066984-138dadb4c035','1521590832167-7bcbfaa6381f','1522336572468-97b06e8ef143','1487412947147-5cebf100ffc2','1595476108010-b4d1f102b1b1'],
   'Lefkoşa Dereboyu''nda saç tasarımında öncü, ödüllü stilistlerle hizmet veren modern kuaför.','approved'),
 ('00000000-0000-0000-0000-000000000003','Ada Barber','barber','Berber','Gazimağusa','Salamis Yolu No:8','+90 533 904 00 08','{1,2,3,4,5,6}','10:00','21:00',30,4.7,156,'1585747860715-2ba37e788b70',
   array['1585747860715-2ba37e788b70','1503951914875-452162b0f3f1','1605497788044-5a32c7078486','1599351431202-1e0f0137899a','1521490878406-8d3d05fd2f33'],
   'Gazimağusa''nın gözde berberi. Klasik tıraş geleneğini modern dokunuşlarla buluşturan samimi bir mekan.','approved')
on conflict (id) do nothing;

insert into public.services (business_id, name, duration_min, price, popular) values
 ('00000000-0000-0000-0000-000000000001','Saç Kesimi',30,350,false),
 ('00000000-0000-0000-0000-000000000001','Sakal Tıraşı',20,200,false),
 ('00000000-0000-0000-0000-000000000001','Saç + Sakal Paketi',50,500,true),
 ('00000000-0000-0000-0000-000000000002','Saç Kesimi',40,450,false),
 ('00000000-0000-0000-0000-000000000002','Saç Boyama',90,1200,false),
 ('00000000-0000-0000-0000-000000000002','Fön & Şekillendirme',30,250,false),
 ('00000000-0000-0000-0000-000000000002','Keratin Bakımı',120,null,false),
 ('00000000-0000-0000-0000-000000000003','Saç Kesimi',30,300,false),
 ('00000000-0000-0000-0000-000000000003','Sakal Tıraşı',20,180,false),
 ('00000000-0000-0000-0000-000000000003','Çocuk Saç Kesimi',25,null,false)
on conflict do nothing;

-- Örnek rezervasyonlar (bugünün tarihiyle)
insert into public.reservations (business_id, service_name, duration_min, price, date, time, customer_name, customer_phone, status) values
 ('00000000-0000-0000-0000-000000000001','Saç + Sakal Paketi',50,500,current_date,'15:00','Arda Demir','+90 533 812 44 11','pending'),
 ('00000000-0000-0000-0000-000000000001','Sakal Tıraşı',20,200,current_date,'11:30','Burak Şahin','+90 533 277 65 90','approved'),
 ('00000000-0000-0000-0000-000000000002','Saç Boyama',90,1200,current_date,'13:00','Defne Kaya','+90 533 555 12 90','pending')
on conflict do nothing;

-- ----------------------------------------------------------------
-- ADMIN ATAMA — kendi hesabını admin yapmak için:
--   1) Uygulamadan (login.html) bir hesap aç (email + şifre).
--   2) Aşağıdaki satırı kendi email'inle çalıştır:
-- update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'SENIN_EMAILIN@ornek.com');
-- ----------------------------------------------------------------
