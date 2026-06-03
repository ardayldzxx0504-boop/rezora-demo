/* ===========================================================
   Rezora — Data Layer (RezoraDB)
   -----------------------------------------------------------
   Persistent store backed by localStorage.
   Designed as a thin repository so the backend can later be
   swapped for Supabase with minimal changes:
     - Each method maps to a table operation (businesses,
       reservations, messages).
     - Methods return plain data; callers don't touch storage.
     - To migrate: replace read()/write() bodies with Supabase
       queries and make the public methods async (they are
       already called in an await-friendly way where it matters).
   MVP scope: Berber (barber) & Kuaför (salon) only.
   =========================================================== */

const RezoraDB = (function () {
  const KEYS = {
    businesses:   "rezora_businesses",
    reservations: "rezora_reservations",
    messages:     "rezora_messages",
    seeded:       "rezora_seed_v1",
  };

  /* status that still occupies a time slot (rejected frees it) */
  const ACTIVE = ["pending", "approved", "completed"];

  /* ---- low-level storage (swap these two for Supabase) ---- */
  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }
  function uid(prefix) {
    return (prefix || "id") + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }
  function isoDate(d) {
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  function offsetIso(days) { const d = new Date(); d.setDate(d.getDate() + days); return isoDate(d); }
  const TR_MONTHS = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
  function labelFromIso(iso) {
    const d = new Date(iso + "T00:00:00");
    return `${d.getDate()} ${TR_MONTHS[d.getMonth()]}`;
  }

  /* ----------------------------- SEED ----------------------------- */
  function seedBusinesses() {
    return [
      {
        id: "elite-barber", name: "Elite Barber", category: "barber", categoryName: "Berber",
        city: "Girne", area: "Karaoğlanoğlu Cd. No:14", phone: "+90 533 812 00 14",
        workingDays: [1,2,3,4,5,6], openTime: "10:00", closeTime: "20:00", slotMinutes: 30,
        rating: 4.9, reviews: 312, img: "1503951914875-452162b0f3f1",
        gallery: ["1503951914875-452162b0f3f1","1585747860715-2ba37e788b70","1599351431202-1e0f0137899a","1521490878406-8d3d05fd2f33","1605497788044-5a32c7078486"],
        desc: "Girne'nin kalbinde, modern erkek bakımını sanatla buluşturan butik bir berber. Deneyimli ustalar, premium ürünler ve rahat bir atmosfer.",
        services: [
          { id: "svc-haircut", name: "Saç Kesimi", dur: 30, price: 350 },
          { id: "svc-beard",   name: "Sakal Tıraşı", dur: 20, price: 200 },
          { id: "svc-combo",   name: "Saç + Sakal Paketi", dur: 50, price: 500, popular: true },
        ],
        reviewsList: [
          { name: "Mert A.", date: "3 gün önce", stars: 5, text: "Şehirdeki en iyi berber. Randevu sistemi sayesinde hiç beklemeden hizmet aldım." },
          { name: "Can Y.", date: "1 hafta önce", stars: 5, text: "Sakal tıraşı muhteşemdi, sıcak havlu detayı çok hoşuma gitti." },
          { name: "Deniz K.", date: "2 hafta önce", stars: 4, text: "Usta işini gerçekten biliyor. Randevu ile beklemek tarih oldu." },
        ],
      },
      {
        id: "modern-kuafor", name: "Modern Kuaför", category: "salon", categoryName: "Kuaför",
        city: "Lefkoşa", area: "Dereboyu Cd. No:42", phone: "+90 533 277 00 42",
        workingDays: [1,2,3,4,5,6], openTime: "09:30", closeTime: "19:30", slotMinutes: 30,
        rating: 4.8, reviews: 204, img: "1560066984-138dadb4c035",
        gallery: ["1560066984-138dadb4c035","1521590832167-7bcbfaa6381f","1522336572468-97b06e8ef143","1487412947147-5cebf100ffc2","1595476108010-b4d1f102b1b1"],
        desc: "Lefkoşa Dereboyu'nda saç tasarımında öncü, ödüllü stilistlerle hizmet veren modern kuaför. Boya, bakım ve şekillendirmede uzman.",
        services: [
          { id: "svc-cut",     name: "Saç Kesimi", dur: 40, price: 450 },
          { id: "svc-color",   name: "Saç Boyama", dur: 90, price: 1200 },
          { id: "svc-blow",    name: "Fön & Şekillendirme", dur: 30, price: 250 },
          { id: "svc-keratin", name: "Keratin Bakımı", dur: 120, price: null },
        ],
        reviewsList: [
          { name: "Selin A.", date: "4 gün önce", stars: 5, text: "Boyam harika oldu, tam istediğim ton. Ekip çok ilgili." },
          { name: "Ece T.", date: "2 hafta önce", stars: 5, text: "Keratin bakımından sonra saçlarım yeniden doğdu resmen." },
        ],
      },
      {
        id: "ada-barber", name: "Ada Barber", category: "barber", categoryName: "Berber",
        city: "Gazimağusa", area: "Salamis Yolu No:8", phone: "+90 533 904 00 08",
        workingDays: [1,2,3,4,5,6], openTime: "10:00", closeTime: "21:00", slotMinutes: 30,
        rating: 4.7, reviews: 156, img: "1585747860715-2ba37e788b70",
        gallery: ["1585747860715-2ba37e788b70","1503951914875-452162b0f3f1","1605497788044-5a32c7078486","1599351431202-1e0f0137899a","1521490878406-8d3d05fd2f33"],
        desc: "Gazimağusa'nın gözde berberi. Klasik tıraş geleneğini modern dokunuşlarla buluşturan samimi bir mekan.",
        services: [
          { id: "svc-cut",   name: "Saç Kesimi", dur: 30, price: 300 },
          { id: "svc-beard", name: "Sakal Tıraşı", dur: 20, price: 180 },
          { id: "svc-kid",   name: "Çocuk Saç Kesimi", dur: 25, price: null },
        ],
        reviewsList: [
          { name: "Burak Ş.", date: "5 gün önce", stars: 5, text: "Mahallenin en iyisi. Çocuğumu da rahatça getiriyorum." },
          { name: "Tolga K.", date: "3 hafta önce", stars: 4, text: "Hızlı ve temiz hizmet, fiyatlar da gayet uygun." },
        ],
      },
    ];
  }

  function seedReservations() {
    // Dates are stored as ISO and relabelled dynamically, so the demo
    // always looks "live" regardless of when it was seeded.
    return [
      { id:"RZ-2041", bizId:"elite-barber", serviceId:"svc-combo",   serviceName:"Saç + Sakal Paketi", price:500, date:offsetIso(0), time:"15:00", name:"Arda Demir",    phone:"+90 533 812 44 11", status:"pending",   note:"", createdAt:Date.now()-3600e3 },
      { id:"RZ-2040", bizId:"elite-barber", serviceId:"svc-haircut", serviceName:"Saç Kesimi",         price:350, date:offsetIso(0), time:"16:30", name:"Kerem Yılmaz",  phone:"+90 542 119 87 03", status:"pending",   note:"", createdAt:Date.now()-5400e3 },
      { id:"RZ-2039", bizId:"elite-barber", serviceId:"svc-beard",   serviceName:"Sakal Tıraşı",       price:200, date:offsetIso(0), time:"11:30", name:"Burak Şahin",   phone:"+90 533 277 65 90", status:"approved",  note:"", createdAt:Date.now()-9*3600e3 },
      { id:"RZ-2038", bizId:"elite-barber", serviceId:"svc-combo",   serviceName:"Saç + Sakal Paketi", price:500, date:offsetIso(0), time:"14:00", name:"Emre Korkmaz",  phone:"+90 548 600 32 18", status:"approved",  note:"", createdAt:Date.now()-8*3600e3 },
      { id:"RZ-2037", bizId:"elite-barber", serviceId:"svc-haircut", serviceName:"Saç Kesimi",         price:350, date:offsetIso(1), time:"10:30", name:"Tolga Aksoy",   phone:"+90 533 904 11 76", status:"pending",   note:"", createdAt:Date.now()-2*3600e3 },
      { id:"RZ-2036", bizId:"elite-barber", serviceId:"svc-haircut", serviceName:"Saç Kesimi",         price:350, date:offsetIso(-1),time:"17:00", name:"Onur Çelik",    phone:"+90 542 388 47 22", status:"completed", note:"", createdAt:Date.now()-26*3600e3 },
      { id:"RZ-2035", bizId:"elite-barber", serviceId:"svc-beard",   serviceName:"Sakal Tıraşı",       price:200, date:offsetIso(-1),time:"18:00", name:"Mehmet Öz",     phone:"+90 548 221 76 55", status:"rejected",  note:"", createdAt:Date.now()-28*3600e3 },

      { id:"RZ-2042", bizId:"modern-kuafor", serviceId:"svc-color", serviceName:"Saç Boyama", price:1200, date:offsetIso(0), time:"13:00", name:"Defne Kaya",  phone:"+90 533 555 12 90", status:"pending",  note:"", createdAt:Date.now()-1800e3 },
      { id:"RZ-2043", bizId:"modern-kuafor", serviceId:"svc-cut",   serviceName:"Saç Kesimi", price:450,  date:offsetIso(0), time:"15:30", name:"Ece Toprak",  phone:"+90 542 777 65 21", status:"approved", note:"", createdAt:Date.now()-4*3600e3 },

      { id:"RZ-2044", bizId:"ada-barber", serviceId:"svc-cut",   serviceName:"Saç Kesimi",   price:300, date:offsetIso(0), time:"16:00", name:"Serkan Demir", phone:"+90 533 745 90 14", status:"pending",  note:"", createdAt:Date.now()-2400e3 },
      { id:"RZ-2045", bizId:"ada-barber", serviceId:"svc-beard", serviceName:"Sakal Tıraşı", price:180, date:offsetIso(1), time:"12:00", name:"Hakan Mert",   phone:"+90 548 100 22 88", status:"approved", note:"", createdAt:Date.now()-6*3600e3 },
    ];
  }

  function ensureSeeded(force) {
    if (!force && read(KEYS.seeded, false)) return;
    write(KEYS.businesses, seedBusinesses());
    const res = seedReservations();
    write(KEYS.reservations, res);
    // generate a couple of historical WhatsApp logs for already-approved seeds
    const biz = seedBusinesses();
    const msgs = [];
    res.filter(r => r.status === "approved").forEach(r => {
      const b = biz.find(x => x.id === r.bizId);
      msgs.push(makeMessage("approved", r, b, r.createdAt + 600000));
    });
    write(KEYS.messages, msgs);
    write(KEYS.seeded, true);
  }

  /* ----------------------------- MESSAGES ------------------------- */
  function firstName(full) { return (full || "").trim().split(/\s+/)[0] || ""; }

  function messageText(type, r, b) {
    const f = firstName(r.name);
    const bn = b ? b.name : "işletme";
    const label = r.dateLabel || labelFromIso(r.date);
    switch (type) {
      case "created":
        return `Merhaba ${f} 👋 ${bn} için ${label} ${r.time} rezervasyon talebiniz alındı. İşletme onayladığında sizi bilgilendireceğiz.`;
      case "approved":
        return `✅ Merhaba ${f}, ${bn} için ${label} saat ${r.time} rezervasyonunuz ONAYLANDI. Adres: ${b ? b.area + ", " + b.city : ""}. Görüşmek üzere!`;
      case "rejected":
        return `Merhaba ${f}, ${bn} için ${label} ${r.time} rezervasyon talebiniz maalesef onaylanamadı. Dilerseniz farklı bir saat için tekrar deneyebilirsiniz.`;
      case "completed":
        return `${bn} ziyaretiniz için teşekkürler ${f}! Deneyiminizi değerlendirmek ister misiniz? ⭐ rezora.app/p/${r.id}`;
      default: return "";
    }
  }
  function makeMessage(type, r, b, ts) {
    return {
      id: uid("msg"), reservationId: r.id, bizId: r.bizId,
      to: r.phone, channel: "whatsapp", type,
      text: messageText(type, r, b),
      status: "sent",
      sentAt: ts || Date.now(),
    };
  }
  function pushMessage(msg) {
    const all = read(KEYS.messages, []);
    all.unshift(msg);
    write(KEYS.messages, all);
    return msg;
  }

  /* ----------------------------- PUBLIC API ----------------------- */
  ensureSeeded(false);

  return {
    KEYS,
    isoDate, offsetIso, labelFromIso,

    /* -- businesses -- */
    getBusinesses() { return read(KEYS.businesses, []); },
    getBusiness(id) { return this.getBusinesses().find(b => b.id === id) || null; },
    updateBusiness(id, patch) {
      const all = this.getBusinesses();
      const i = all.findIndex(b => b.id === id);
      if (i < 0) return null;
      all[i] = Object.assign({}, all[i], patch);
      write(KEYS.businesses, all);
      return all[i];
    },
    startingPrice(b) {
      const prices = (b.services || []).map(s => s.price).filter(p => p !== null && p !== undefined && p !== "");
      return prices.length ? Math.min.apply(null, prices) : null;
    },

    /* -- services -- */
    addService(bizId, svc) {
      const all = this.getBusinesses();
      const b = all.find(x => x.id === bizId);
      if (!b) return null;
      b.services = b.services || [];
      const price = (svc.price === "" || svc.price === null || svc.price === undefined) ? null : Number(svc.price);
      b.services.push({ id: uid("svc"), name: svc.name, dur: Number(svc.dur) || 30, price });
      write(KEYS.businesses, all);
      return b;
    },
    removeService(bizId, svcId) {
      const all = this.getBusinesses();
      const b = all.find(x => x.id === bizId);
      if (!b) return null;
      b.services = (b.services || []).filter(s => s.id !== svcId);
      write(KEYS.businesses, all);
      return b;
    },

    /* -- reservations -- */
    getReservations() { return read(KEYS.reservations, []); },
    getReservation(id) { return this.getReservations().find(r => r.id === id) || null; },
    getReservationsByBusiness(bizId) {
      return this.getReservations()
        .filter(r => r.bizId === bizId)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    },
    getTakenTimes(bizId, isoDateStr) {
      return this.getReservations()
        .filter(r => r.bizId === bizId && r.date === isoDateStr && ACTIVE.indexOf(r.status) !== -1)
        .map(r => r.time);
    },
    isSlotTaken(bizId, isoDateStr, time, excludeId) {
      return this.getReservations().some(r =>
        r.bizId === bizId && r.date === isoDateStr && r.time === time &&
        ACTIVE.indexOf(r.status) !== -1 && r.id !== excludeId);
    },

    /* create a reservation (re-checks conflict server-side style) */
    createReservation(payload) {
      const b = this.getBusiness(payload.bizId);
      if (!b) return { ok: false, error: "İşletme bulunamadı." };
      if (this.isSlotTaken(payload.bizId, payload.date, payload.time)) {
        return { ok: false, error: "Bu saat az önce doldu. Lütfen başka bir saat seçin." };
      }
      const svc = (b.services || []).find(s => s.id === payload.serviceId) || {};
      const all = this.getReservations();
      const num = 2046 + all.length;
      const reservation = {
        id: "RZ-" + num,
        bizId: b.id,
        serviceId: payload.serviceId,
        serviceName: svc.name || payload.serviceName || "",
        price: (svc.price === undefined ? (payload.price ?? null) : svc.price),
        date: payload.date,
        dateLabel: payload.dateLabel || labelFromIso(payload.date),
        time: payload.time,
        name: payload.name,
        phone: payload.phone,
        note: payload.note || "",
        status: "pending",
        createdAt: Date.now(),
      };
      all.unshift(reservation);
      write(KEYS.reservations, all);
      // WhatsApp simulation: notify the customer the request was received
      pushMessage(makeMessage("created", reservation, b));
      return { ok: true, reservation };
    },

    /* approve / reject / complete — generates WhatsApp simulation */
    setStatus(id, status) {
      const all = this.getReservations();
      const r = all.find(x => x.id === id);
      if (!r) return { ok: false, error: "Rezervasyon bulunamadı." };
      r.status = status;
      write(KEYS.reservations, all);
      let message = null;
      if (["approved", "rejected", "completed"].indexOf(status) !== -1) {
        const b = this.getBusiness(r.bizId);
        message = pushMessage(makeMessage(status, r, b));
      }
      return { ok: true, reservation: r, message };
    },

    /* -- messages (WhatsApp simulation log) -- */
    getMessages() { return read(KEYS.messages, []); },
    getMessagesByBusiness(bizId) { return this.getMessages().filter(m => m.bizId === bizId); },
    previewMessage(type, r, b) { return messageText(type, r, b); },

    /* -- maintenance -- */
    resetDemo() { ensureSeeded(true); },
  };
})();
