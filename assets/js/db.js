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
             channel: m.channel, type: m.type, text: m.text, status: m.status, sentAt: m.sent_at };
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
      const { data, error } = await sb.from("businesses").update(row).eq("id", id).select("*, services(*)").maybeSingle();
      if (error) { console.error(error); return null; }
      return mapBusiness(data);
    },
    async setBusinessStatus(id, status) { return this.updateBusiness(id, { status }); },
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
        if ((error.message || "").indexOf("SLOT_CONFLICT") !== -1)
          return { ok: false, error: "Bu saat az önce doldu. Lütfen başka bir saat seçin." };
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
      msg = await this._deliver(msg);
      return msg;
    },
    // Bildirim servisini çağırır ve sonuca göre durumu günceller (sent/failed).
    async _deliver(msg) {
      if (!msg || !msg.id) return msg;
      if (typeof window === "undefined" || !window.RezoraNotifier) return msg; // servis yoksa pending kalır
      const res = await window.RezoraNotifier.send(msg);
      const updated = await this.updateMessageStatus(msg.id, res.status || "sent");
      return updated || msg;
    },
    async updateMessageStatus(id, status) {
      if (notReady()) return null;
      const { data, error } = await sb.from("messages").update({ status }).eq("id", id).select().maybeSingle();
      if (error) { console.error(error); return null; }
      return data ? mapMessage(data) : null;
    },
    // Dashboard "Tekrar gönder": mevcut mesajı yeniden gönderir (owner/admin).
    async resendMessage(id) {
      if (notReady()) return { ok: false };
      const { data } = await sb.from("messages").select("*").eq("id", id).maybeSingle();
      if (!data) return { ok: false, error: "Mesaj bulunamadı" };
      let msg = mapMessage(data);
      await this.updateMessageStatus(id, "pending");
      const res = window.RezoraNotifier ? await window.RezoraNotifier.send(msg) : { status: "sent" };
      const updated = await this.updateMessageStatus(id, res.status || "sent");
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
