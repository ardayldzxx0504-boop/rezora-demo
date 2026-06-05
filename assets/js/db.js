/* ===========================================================
   Rezora — Veri Katmanı (Supabase)
   -----------------------------------------------------------
   Tüm veri Supabase'te saklanır (localStorage YOK).
   - Tarayıcı tarafı @supabase/supabase-js (CDN) istemcisi.
   - Güvenlik Row Level Security (RLS) ile sağlanır.
   - DB satırları, sayfaların beklediği camelCase şekle map'lenir.
   Tüm metotlar async'tir (Promise döner).
   =========================================================== */

const Rezora = (function () {
  const _M = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
  function labelFromIso(iso) { if (!iso) return ""; const d = new Date(iso + "T00:00:00"); return d.getDate() + " " + _M[d.getMonth()]; }

  /* ---- Abonelik (tek model: 3 ay ücretsiz deneme) ---- */
  const SUB_LABELS = {
    trial:     { label: "Deneme",   cls: "badge-purple" },
    active:    { label: "Aktif",    cls: "badge-green" },
    expired:   { label: "Süresi doldu", cls: "badge-red" },
    cancelled: { label: "İptal",    cls: "badge-gray" },
  };
  // İşletme nesnesinden etkin abonelik durumunu hesaplar (tarih bazlı).
  function subscriptionInfo(b) {
    const status = (b && b.subscriptionStatus) || "trial";
    const now = Date.now();
    let active = false, daysLeft = null, expired = false;
    if (status === "active") {
      active = true;
    } else if (status === "trial") {
      const end = b && b.trialEndsAt ? new Date(b.trialEndsAt).getTime() : null;
      if (end === null) { active = true; }
      else {
        daysLeft = Math.ceil((end - now) / 86400000);
        active = end > now;
        expired = end <= now;
      }
    } else { // expired | cancelled
      expired = status === "expired";
    }
    const meta = SUB_LABELS[status] || SUB_LABELS.trial;
    return { status, active, daysLeft, expired, label: meta.label, cls: meta.cls };
  }
  function subActive(b) { return subscriptionInfo(b).active; }

  const configured = !!window.SUPABASE_CONFIGURED;
  let sb = null;
  if (configured && window.supabase && window.supabase.createClient) {
    sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }

  /* ---- map helpers (DB snake_case -> app camelCase) ---- */
  function mapService(s) {
    return { id: s.id, name: s.name, dur: s.duration_min, price: (s.price === null ? null : Number(s.price)), popular: !!s.popular };
  }
  function mapBusiness(b) {
    return {
      id: b.id, ownerId: b.owner_id, name: b.name,
      category: b.category, categoryName: b.category_name,
      city: b.city, area: b.area, phone: b.phone,
      workingDays: b.working_days || [1,2,3,4,5,6],
      openTime: b.open_time, closeTime: b.close_time, slotMinutes: b.slot_minutes,
      rating: b.rating ? Number(b.rating) : 5, reviews: b.reviews || 0,
      img: b.img, gallery: b.gallery || [], desc: b.description || "",
      applyNote: b.apply_note || "",
      status: b.status, createdAt: b.created_at,
      subscriptionStatus: b.subscription_status || null,
      trialStartedAt: b.trial_started_at || null,
      trialEndsAt: b.trial_ends_at || null,
      subscriptionStartedAt: b.subscription_started_at || null,
      subscriptionEndsAt: b.subscription_ends_at || null,
      services: (b.services || []).map(mapService),
      reviewsList: [],
    };
  }
  function mapReservation(r) {
    return {
      id: r.id, bizId: r.business_id, serviceId: r.service_id,
      serviceName: r.service_name, durationMin: r.duration_min,
      price: (r.price === null ? null : Number(r.price)),
      date: r.date, dateLabel: labelFromIso(r.date), time: r.time,
      name: r.customer_name, phone: r.customer_phone, note: r.note,
      status: r.status, createdAt: r.created_at,
    };
  }
  function mapMessage(m) {
    return { id: m.id, reservationId: m.reservation_id, bizId: m.business_id, to: m.to_phone,
             channel: m.channel, type: m.type, text: m.text, status: m.status, error: m.error || null, sentAt: m.sent_at };
  }
  function mapSupportThread(t) {
    return { id: t.id, userName: t.user_name, phone: t.phone, email: t.email, subject: t.subject,
             status: t.status, createdAt: t.created_at, updatedAt: t.updated_at, unread: 0 };
  }
  function mapSupportMessage(m) {
    return { id: m.id, threadId: m.thread_id, sender: m.sender_type, message: m.message,
             createdAt: m.created_at, readAt: m.read_at || null };
  }

  function notReady() { return !sb; }

  /* ---- WhatsApp mesaj metni (simülasyon) ---- */
  function firstName(full) { return (full || "").trim().split(/\s+/)[0] || ""; }
  function messageText(type, r, b) {
    const f = firstName(r.name || r.customer_name);
    const bn = b ? b.name : "işletme";
    const label = r.dateLabel || labelFromIso(r.date);
    switch (type) {
      case "created":  return `Merhaba ${f} 👋 ${bn} için ${label} ${r.time} rezervasyon talebiniz alındı. İşletme onayladığında sizi bilgilendireceğiz.`;
      case "approved": return `✅ Merhaba ${f}, ${bn} için ${label} saat ${r.time} rezervasyonunuz ONAYLANDI. Adres: ${b ? (b.area + ", " + b.city) : ""}. Görüşmek üzere!`;
      case "rejected": return `Merhaba ${f}, ${bn} için ${label} ${r.time} rezervasyon talebiniz maalesef onaylanamadı. Dilerseniz farklı bir saat için tekrar deneyebilirsiniz.`;
      case "completed":return `${bn} ziyaretiniz için teşekkürler ${f}! Deneyiminizi değerlendirmek ister misiniz? ⭐`;
      default: return "";
    }
  }

  return {
    configured,
    client() { return sb; },
    previewMessage(type, r, b) { return messageText(type, r, b); },
    subscriptionInfo,

    /* ============ AUTH ============ */
    async signUp(email, password, meta) {
      if (notReady()) return { ok: false, error: "Supabase yapılandırılmadı." };
      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) return { ok: false, error: error.message };
      return { ok: true, user: data.user, session: data.session };
    },
    async signIn(email, password) {
      if (notReady()) return { ok: false, error: "Supabase yapılandırılmadı." };
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) return { ok: false, error: error.message };
      return { ok: true, user: data.user, session: data.session };
    },
    async signOut() { if (sb) await sb.auth.signOut(); },
    async getSession() { if (notReady()) return null; const { data } = await sb.auth.getSession(); return data.session; },
    async getUser() { if (notReady()) return null; const { data } = await sb.auth.getUser(); return data.user; },
    async getProfile() {
      if (notReady()) return null;
      const u = await this.getUser(); if (!u) return null;
      const { data } = await sb.from("profiles").select("*").eq("id", u.id).maybeSingle();
      return data;
    },
    async isAdmin() { const p = await this.getProfile(); return !!p && p.role === "admin"; },

    /* ============ BUSINESSES ============ */
    async getBusinesses() {
      if (notReady()) return [];
      const { data, error } = await sb.from("businesses")
        .select("*, services(*)").eq("status", "approved").order("created_at", { ascending: true });
      if (error) { console.error(error); return []; }
      return (data || []).map(mapBusiness);
    },
    async getBusiness(id) {
      if (notReady() || !id) return null;
      const { data, error } = await sb.from("businesses").select("*, services(*)").eq("id", id).maybeSingle();
      if (error || !data) return null;
      return mapBusiness(data);
    },
    async getMyBusiness() {
      if (notReady()) return null;
      const u = await this.getUser(); if (!u) return null;
      const { data } = await sb.from("businesses").select("*, services(*)").eq("owner_id", u.id).maybeSingle();
      return data ? mapBusiness(data) : null;
    },
    async getAllBusinesses() { // admin
      if (notReady()) return [];
      const { data, error } = await sb.from("businesses").select("*, services(*)").order("created_at", { ascending: false });
      if (error) { console.error(error); return []; }
      return (data || []).map(mapBusiness);
    },
    async getOwnerInfo(ownerId) { // admin: başvuru sahibi e-postası
      if (notReady() || !ownerId) return null;
      const { data } = await sb.from("profiles").select("email,full_name").eq("id", ownerId).maybeSingle();
      return data || null;
    },
    async createBusiness(payload) {
      if (notReady()) return { ok: false, error: "Supabase yapılandırılmadı." };
      const u = await this.getUser();
      const row = {
        owner_id: payload.ownerId || (u ? u.id : null),
        name: payload.name, category: payload.category || "barber",
        category_name: payload.category === "salon" ? "Kuaför" : "Berber",
        city: payload.city, area: payload.area, phone: payload.phone,
        working_days: payload.workingDays || [1,2,3,4,5,6],
        open_time: payload.openTime || "10:00", close_time: payload.closeTime || "20:00",
        slot_minutes: payload.slotMinutes || 30,
        img: payload.img || "1503951914875-452162b0f3f1",
        description: payload.desc || "",
        apply_note: payload.applyNote || null,
        status: payload.status || "pending",
        // subscription_status / trial tarihleri onay trigger'ı (set_trial_on_approve) ile atanır.
      };
      const { data, error } = await sb.from("businesses").insert(row).select().maybeSingle();
      if (error) return { ok: false, error: error.message };
      return { ok: true, business: mapBusiness(data) };
    },
    async updateBusiness(id, patch) {
      if (notReady()) return null;
      const row = {};
      if (patch.name !== undefined) row.name = patch.name;
      if (patch.city !== undefined) row.city = patch.city;
      if (patch.area !== undefined) row.area = patch.area;
      if (patch.phone !== undefined) row.phone = patch.phone;
      if (patch.workingDays !== undefined) row.working_days = patch.workingDays;
      if (patch.openTime !== undefined) row.open_time = patch.openTime;
      if (patch.closeTime !== undefined) row.close_time = patch.closeTime;
      if (patch.slotMinutes !== undefined) row.slot_minutes = patch.slotMinutes;
      if (patch.status !== undefined) row.status = patch.status;
      if (patch.subscriptionStatus !== undefined) row.subscription_status = patch.subscriptionStatus;
      if (patch.trialStartedAt !== undefined) row.trial_started_at = patch.trialStartedAt;
      if (patch.trialEndsAt !== undefined) row.trial_ends_at = patch.trialEndsAt;
      if (patch.subscriptionStartedAt !== undefined) row.subscription_started_at = patch.subscriptionStartedAt;
      if (patch.subscriptionEndsAt !== undefined) row.subscription_ends_at = patch.subscriptionEndsAt;
      const { data, error } = await sb.from("businesses").update(row).eq("id", id).select("*, services(*)").maybeSingle();
      if (error) { console.error(error); return null; }
      return mapBusiness(data);
    },
    async setBusinessStatus(id, status) { return this.updateBusiness(id, { status }); },

    /* ---- Abonelik yönetimi (admin) ---- */
    async setSubscriptionStatus(id, status) { return this.updateBusiness(id, { subscriptionStatus: status }); },
    // Aboneliği aktif yap: süresiz aktif (subscription_started_at=now, ends=null)
    async activateSubscription(id) {
      return this.updateBusiness(id, {
        subscriptionStatus: "active",
        subscriptionStartedAt: new Date().toISOString(),
        subscriptionEndsAt: null,
      });
    },
    async cancelSubscription(id) { return this.updateBusiness(id, { subscriptionStatus: "cancelled" }); },
    // Denemeyi N ay uzat (varsayılan 1). Mevcut bitişten ileri; geçmişse şu andan itibaren.
    async extendTrial(id, months) {
      months = months || 1;
      const b = await this.getBusiness(id);
      if (!b) return null;
      const base = (b.trialEndsAt && new Date(b.trialEndsAt).getTime() > Date.now())
        ? new Date(b.trialEndsAt) : new Date();
      const end = new Date(base); end.setMonth(end.getMonth() + months);
      return this.updateBusiness(id, {
        subscriptionStatus: "trial",
        trialStartedAt: b.trialStartedAt || new Date().toISOString(),
        trialEndsAt: end.toISOString(),
      });
    },
    async deleteBusiness(id) {
      if (notReady()) return { ok: false };
      const { error } = await sb.from("businesses").delete().eq("id", id);
      return { ok: !error, error: error && error.message };
    },
    startingPrice(b) {
      const prices = (b.services || []).map(s => s.price).filter(p => p !== null && p !== undefined && p !== "");
      return prices.length ? Math.min.apply(null, prices) : null;
    },

    /* ============ SERVICES ============ */
    async addService(bizId, svc) {
      if (notReady()) return { ok: false };
      const price = (svc.price === "" || svc.price === null || svc.price === undefined) ? null : Number(svc.price);
      const { error } = await sb.from("services").insert({
        business_id: bizId, name: svc.name, duration_min: Number(svc.dur) || 30, price,
      });
      return { ok: !error, error: error && error.message };
    },
    async removeService(svcId) {
      if (notReady()) return { ok: false };
      const { error } = await sb.from("services").delete().eq("id", svcId);
      return { ok: !error, error: error && error.message };
    },

    /* ============ AVAILABILITY (duration-based) ============ */
    // Belirli gün için dolu aralıkları döndürür: [{startMin, endMin}]
    async getTakenIntervals(bizId, isoDate) {
      if (notReady()) return [];
      const { data, error } = await sb.rpc("taken_slots", { bid: bizId, d: isoDate });
      if (error) { console.error(error); return []; }
      return (data || []).map(row => {
        const sm = toMin(row.t);
        return { startMin: sm, endMin: sm + (row.dur || 30) };
      });
    },
    // Bir slot, seçilen hizmet süresine göre uygun mu?
    slotIsFree(startTime, durationMin, intervals, closeTime) {
      const s = toMin(startTime), e = s + durationMin;
      if (closeTime && e > toMin(closeTime)) return false;
      return !intervals.some(iv => s < iv.endMin && iv.startMin < e);
    },

    /* ============ RESERVATIONS ============ */
    async createReservation(payload) {
      if (notReady()) return { ok: false, error: "Supabase yapılandırılmadı." };
      // id'yi istemcide üretiyoruz: anon müşteri RLS gereği eklenen satırı geri okuyamaz,
      // bu yüzden insert sonrası .select() yapmadan rezervasyon nesnesini yerelde kuruyoruz.
      const id = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : undefined;
      const durationMin = payload.durationMin || 30;
      const price = (payload.price === undefined ? null : payload.price);
      const row = {
        id,
        business_id: payload.bizId, service_id: payload.serviceId || null,
        service_name: payload.serviceName, duration_min: durationMin,
        price,
        date: payload.date, time: payload.time,
        customer_name: payload.name, customer_phone: payload.phone, note: payload.note || "",
        status: "pending",
      };
      const { error } = await sb.from("reservations").insert(row);
      if (error) {
        const m = error.message || "";
        if (m.indexOf("SLOT_CONFLICT") !== -1)
          return { ok: false, error: "Bu saat az önce doldu. Lütfen başka bir saat seçin." };
        if (m.indexOf("SUBSCRIPTION_INACTIVE") !== -1)
          return { ok: false, code: "SUBSCRIPTION_INACTIVE", error: "Bu işletme şu anda online rezervasyon kabul etmiyor. Lütfen işletmeyi telefonla arayın." };
        return { ok: false, error: error.message };
      }
      const r = {
        id, bizId: payload.bizId, serviceId: payload.serviceId || null,
        serviceName: payload.serviceName, durationMin, price,
        date: payload.date, dateLabel: labelFromIso(payload.date), time: payload.time,
        name: payload.name, phone: payload.phone, note: payload.note || "",
        status: "pending", createdAt: new Date().toISOString(),
      };
      const b = await this.getBusiness(r.bizId);
      await this._logMessage("created", r, b);
      return { ok: true, reservation: r };
    },
    async getReservationsByBusiness(bizId) {
      if (notReady()) return [];
      const { data, error } = await sb.from("reservations").select("*").eq("business_id", bizId).order("created_at", { ascending: false });
      if (error) { console.error(error); return []; }
      return (data || []).map(mapReservation);
    },
    async setStatus(id, status) {
      if (notReady()) return { ok: false };
      const { data, error } = await sb.from("reservations").update({ status }).eq("id", id).select().maybeSingle();
      if (error) return { ok: false, error: error.message };
      const r = mapReservation(data);
      let message = null;
      if (["approved","rejected","completed"].indexOf(status) !== -1) {
        const b = await this.getBusiness(r.bizId);
        message = await this._logMessage(status, r, b);
      }
      return { ok: true, reservation: r, message };
    },

    /* ============ MESSAGES (WhatsApp — şimdilik mock gönderim) ============ */
    // Mesaj önce 'pending' olarak yazılır, ardından bildirim servisi ile gönderilir.
    async _logMessage(type, r, b) {
      if (notReady()) return null;
      const row = { reservation_id: r.id, business_id: r.bizId, to_phone: r.phone,
                    channel: "whatsapp", type, text: messageText(type, r, b), status: "pending" };
      // anon (müşteri 'created') RLS gereği eklenen satırı geri okuyamaz -> 'pending' kalır,
      // işletme panelinden "Tekrar gönder" ile gönderilebilir.
      const { data } = await sb.from("messages").insert(row).select().maybeSingle();
      if (!data) return null;
      let msg = mapMessage(data);
      // Süresi dolmuş/iptal aboneliklerde WhatsApp kapalı: mesaj kaydı tutulur ama otomatik gönderilmez ('pending' kalır).
      if (b && !subActive(b)) return msg;
      msg = await this._deliver(msg);
      return msg;
    },
    // Bildirim servisini çağırır ve sonuca göre durumu günceller (sent/failed + hata).
    async _deliver(msg) {
      if (!msg || !msg.id) return msg;
      if (typeof window === "undefined" || !window.RezoraNotifier) return msg; // servis yoksa pending kalır
      const res = await window.RezoraNotifier.send(msg);
      const updated = await this.updateMessageStatus(msg.id, res.status || "sent", res.error || null);
      return updated || msg;
    },
    async updateMessageStatus(id, status, error) {
      if (notReady()) return null;
      const patch = { status };
      if (error !== undefined) patch.error = error || null;
      const { data, error: updErr } = await sb.from("messages").update(patch).eq("id", id).select().maybeSingle();
      if (updErr) { console.error(updErr); return null; }
      return data ? mapMessage(data) : null;
    },
    // Dashboard "Tekrar gönder": mevcut mesajı yeniden gönderir (owner/admin).
    async resendMessage(id) {
      if (notReady()) return { ok: false };
      const { data } = await sb.from("messages").select("*").eq("id", id).maybeSingle();
      if (!data) return { ok: false, error: "Mesaj bulunamadı" };
      let msg = mapMessage(data);
      // Süresi dolmuş/iptal aboneliklerde WhatsApp gönderimi kapalı.
      const b = await this.getBusiness(msg.bizId);
      if (b && !subActive(b)) {
        const errTxt = "Aboneliğiniz aktif değil. WhatsApp bildirimi için deneme/aboneliğinizi yenileyin.";
        const updated = await this.updateMessageStatus(id, "failed", errTxt);
        return { ok: false, message: updated, error: errTxt };
      }
      await this.updateMessageStatus(id, "pending", null);
      const res = window.RezoraNotifier ? await window.RezoraNotifier.send(msg) : { status: "sent" };
      const updated = await this.updateMessageStatus(id, res.status || "sent", res.error || null);
      return { ok: res.status !== "failed", message: updated, error: res.error };
    },
    async getMessagesByBusiness(bizId) {
      if (notReady()) return [];
      const { data, error } = await sb.from("messages").select("*").eq("business_id", bizId).order("sent_at", { ascending: false });
      if (error) { console.error(error); return []; }
      return (data || []).map(mapMessage);
    },
    async getMessages(limit = 8) {
      if (notReady()) return [];
      const { data, error } = await sb.from("messages").select("*").order("sent_at", { ascending: false }).limit(limit);
      if (error) { console.error(error); return []; }
      return (data || []).map(mapMessage);
    },

    /* ============ REALTIME ============ */
    // Sadece verilen business_id'ye ait değişiklikler dinlenir (RLS de ayrıca uygular).
    subscribeReservations(bizId, handlers) {
      if (notReady() || !bizId) return null;
      handlers = handlers || {};
      const ch = sb.channel("rt-res-" + bizId)
        .on("postgres_changes",
          { event: "INSERT", schema: "public", table: "reservations", filter: "business_id=eq." + bizId },
          (p) => handlers.onInsert && handlers.onInsert(mapReservation(p.new)))
        .on("postgres_changes",
          { event: "UPDATE", schema: "public", table: "reservations", filter: "business_id=eq." + bizId },
          (p) => handlers.onChange && handlers.onChange(mapReservation(p.new)))
        .subscribe();
      return ch;
    },
    subscribeMessages(bizId, onInsert) {
      if (notReady() || !bizId) return null;
      const ch = sb.channel("rt-msg-" + bizId)
        .on("postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: "business_id=eq." + bizId },
          (p) => onInsert && onInsert(mapMessage(p.new)))
        .subscribe();
      return ch;
    },
    unsubscribe(ch) { if (sb && ch) sb.removeChannel(ch); },

    /* ============ CANLI DESTEK (in-app support chat) ============ */
    // --- Public (anon) tarafı: yalnızca RPC üzerinden ---
    async supportStart(payload) {
      if (notReady()) return { ok: false, error: "Supabase yapılandırılmadı." };
      const { data, error } = await sb.rpc("support_start", {
        p_name: payload.name, p_phone: payload.phone || null,
        p_email: payload.email || null, p_subject: payload.subject || null,
        p_message: payload.message,
      });
      if (error) return { ok: false, error: error.message };
      return { ok: true, threadId: data };
    },
    async supportSend(threadId, message) {
      if (notReady()) return { ok: false, error: "Supabase yapılandırılmadı." };
      const { error } = await sb.rpc("support_user_send", { p_thread: threadId, p_message: message });
      if (error) {
        const m = error.message || "";
        if (m.indexOf("THREAD_CLOSED") !== -1) return { ok: false, error: "Bu konuşma kapatıldı. Yeni bir destek talebi oluşturabilirsiniz." };
        if (m.indexOf("THREAD_NOT_FOUND") !== -1) return { ok: false, error: "Konuşma bulunamadı.", notFound: true };
        return { ok: false, error: m };
      }
      return { ok: true };
    },
    async supportFetch(threadId) {
      if (notReady() || !threadId) return null;
      const { data, error } = await sb.rpc("support_thread", { p_thread: threadId });
      if (error || !data || !data.thread) return null;
      return {
        thread: mapSupportThread(data.thread),
        messages: (data.messages || []).map(mapSupportMessage),
      };
    },

    // --- Admin tarafı: doğrudan tablo (RLS=is_admin) ---
    async getSupportThreads() {
      if (notReady()) return [];
      const { data, error } = await sb.from("support_threads").select("*").order("updated_at", { ascending: false });
      if (error) { console.error(error); return []; }
      const threads = (data || []).map(mapSupportThread);
      const { data: un } = await sb.from("support_messages")
        .select("thread_id").eq("sender_type", "user").is("read_at", null);
      const counts = {};
      (un || []).forEach(r => { counts[r.thread_id] = (counts[r.thread_id] || 0) + 1; });
      threads.forEach(t => { t.unread = counts[t.id] || 0; });
      return threads;
    },
    async getSupportMessages(threadId) {
      if (notReady() || !threadId) return [];
      const { data, error } = await sb.from("support_messages").select("*")
        .eq("thread_id", threadId).order("created_at", { ascending: true });
      if (error) { console.error(error); return []; }
      return (data || []).map(mapSupportMessage);
    },
    async supportReply(threadId, message) {
      if (notReady()) return { ok: false };
      const { error } = await sb.from("support_messages").insert({ thread_id: threadId, sender_type: "admin", message });
      if (error) return { ok: false, error: error.message };
      await sb.from("support_threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId);
      return { ok: true };
    },
    async setSupportStatus(threadId, status) {
      if (notReady()) return { ok: false };
      const { error } = await sb.from("support_threads").update({ status, updated_at: new Date().toISOString() }).eq("id", threadId);
      return { ok: !error, error: error && error.message };
    },
    async markThreadRead(threadId) {
      if (notReady()) return;
      await sb.from("support_messages").update({ read_at: new Date().toISOString() })
        .eq("thread_id", threadId).eq("sender_type", "user").is("read_at", null);
    },
    // Admin realtime: yeni destek mesajı/konuşması
    subscribeSupport(handlers) {
      if (notReady()) return null;
      handlers = handlers || {};
      const ch = sb.channel("rt-support")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages" },
          (p) => handlers.onMessage && handlers.onMessage(mapSupportMessage(p.new)))
        .on("postgres_changes", { event: "*", schema: "public", table: "support_threads" },
          (p) => handlers.onThread && handlers.onThread(p.new ? mapSupportThread(p.new) : null))
        .subscribe();
      return ch;
    },
  };

  function toMin(t) { const p = (t || "0:0").split(":"); return (+p[0]) * 60 + (+p[1] || 0); }
})();

/* "Supabase yapılandırılmadı" uyarı bandı (placeholder durumunda) */
function rezoraConfigBanner() {
  if (Rezora.configured) return;
  if (document.getElementById("rzCfgBanner")) return;
  const bar = document.createElement("div");
  bar.id = "rzCfgBanner";
  bar.style.cssText = "position:relative;z-index:50;background:#111;color:#fff;padding:10px 16px;text-align:center;font-size:.85rem;font-weight:600";
  bar.innerHTML = "⚙️ Supabase henüz yapılandırılmadı. Veriler yüklenemez — <code>assets/js/supabase-config.js</code> içine Project URL + anon key girin ve <code>supabase/schema.sql</code> dosyasını çalıştırın.";
  document.body.prepend(bar);
}
