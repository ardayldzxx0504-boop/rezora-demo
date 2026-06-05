/* ===========================================================
   Rezora — Uygulama içi Canlı Destek Widget'ı (public sayfalar)
   -----------------------------------------------------------
   - Sağ altta yuvarlak "Destek" butonu + chat penceresi.
   - İlk mesajda ad/telefon/konu/mesaj alınır, thread oluşturulur.
   - thread_id localStorage'da saklanır (sayfa yenilense de devam).
   - Güvenlik: tüm public erişim Supabase security-definer RPC'leri
     üzerinden (Rezora.supportStart / supportSend / supportFetch).
   - Admin yanıtları kısa aralıklı yoklama (polling) ile yenilemeden
     görünür; admin paneli ise gerçek Supabase realtime kullanır.
   =========================================================== */
(function () {
  if (typeof Rezora === "undefined" || !Rezora.configured) return; // Supabase yoksa widget gösterme

  var LS_THREAD = "rezora_support_thread";
  var LS_SEEN = "rezora_support_seen";
  var POLL_MS = 4000;

  var state = { threadId: localStorage.getItem(LS_THREAD) || null, msgs: [], thread: null, open: false, timer: null, busy: false };

  var ICON_CHAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  var ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  var ICON_SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>';

  function esc(s) { return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function timeStr(iso) { var d = new Date(iso); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }

  /* ---------- DOM ---------- */
  var fab = document.createElement("button");
  fab.className = "rz-support-fab";
  fab.setAttribute("aria-label", "Canlı destek");
  fab.innerHTML = ICON_CHAT + '<span class="rz-sup-fab-txt">Destek</span><span class="rz-sup-dot" id="rzSupDot"></span>';

  var panel = document.createElement("div");
  panel.className = "rz-support-panel";
  panel.innerHTML =
    '<div class="rz-sup-head">' +
      '<div class="rz-sup-head-l"><span class="rz-sup-avatar">' + ICON_CHAT + '</span>' +
        '<div><div class="rz-sup-title">Rezora Destek</div><div class="rz-sup-sub">Genelde birkaç dakika içinde yanıtlarız</div></div>' +
      '</div>' +
      '<button class="rz-sup-x" aria-label="Kapat">' + ICON_CLOSE + '</button>' +
    '</div>' +
    '<div class="rz-sup-body" id="rzSupBody"></div>' +
    '<div class="rz-sup-foot" id="rzSupFoot"></div>';

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  var bodyEl = panel.querySelector("#rzSupBody");
  var footEl = panel.querySelector("#rzSupFoot");
  var dotEl = fab.querySelector("#rzSupDot");

  fab.addEventListener("click", function () { state.open ? closePanel() : openPanel(); });
  panel.querySelector(".rz-sup-x").addEventListener("click", closePanel);

  /* ---------- views ---------- */
  function renderForm(prefillErr) {
    footEl.innerHTML = "";
    bodyEl.innerHTML =
      '<div class="rz-sup-intro">' +
        '<p>Merhaba! 👋 Size nasıl yardımcı olabiliriz? Aşağıdaki formu doldurun, destek ekibimiz en kısa sürede yanıtlasın.</p>' +
      '</div>' +
      (prefillErr ? '<div class="rz-sup-err">' + esc(prefillErr) + '</div>' : '') +
      '<form class="rz-sup-form" id="rzSupForm">' +
        '<input class="rz-sup-input" id="rzSupName" type="text" placeholder="Ad Soyad" required>' +
        '<input class="rz-sup-input" id="rzSupPhone" type="tel" placeholder="Telefon (ör. +90 533 ...)" required>' +
        '<input class="rz-sup-input" id="rzSupSubject" type="text" placeholder="Konu (opsiyonel)">' +
        '<textarea class="rz-sup-input" id="rzSupMsg" rows="3" placeholder="Mesajınız" required></textarea>' +
        '<button class="rz-sup-send-btn" type="submit">Gönder</button>' +
      '</form>';
    document.getElementById("rzSupForm").addEventListener("submit", onStart);
  }

  function renderChat() {
    var closed = state.thread && state.thread.status === "closed";
    bodyEl.innerHTML =
      '<div class="rz-sup-msgs" id="rzSupMsgs"></div>';
    renderMsgs();
    if (closed) {
      footEl.innerHTML =
        '<div class="rz-sup-closed">Bu konuşma kapatıldı.' +
        ' <button class="rz-sup-link" id="rzSupNew">Yeni talep oluştur</button></div>';
      document.getElementById("rzSupNew").addEventListener("click", resetThread);
    } else {
      footEl.innerHTML =
        '<form class="rz-sup-reply" id="rzSupReply">' +
          '<input class="rz-sup-input" id="rzSupReplyInput" type="text" placeholder="Mesaj yazın..." autocomplete="off">' +
          '<button class="rz-sup-icon-btn" type="submit" aria-label="Gönder">' + ICON_SEND + '</button>' +
        '</form>';
      document.getElementById("rzSupReply").addEventListener("submit", onSend);
    }
  }

  function renderMsgs() {
    var box = document.getElementById("rzSupMsgs");
    if (!box) return;
    if (!state.msgs.length) { box.innerHTML = '<div class="rz-sup-empty">Konuşma başlatıldı. Mesajınızı bekliyoruz.</div>'; return; }
    box.innerHTML = state.msgs.map(function (m) {
      var who = m.sender === "admin" ? "admin" : "user";
      return '<div class="rz-bubble-row ' + who + '">' +
        '<div class="rz-bubble ' + who + '">' + esc(m.message) +
        '<span class="rz-bubble-time">' + timeStr(m.createdAt) + '</span></div></div>';
    }).join("");
    box.scrollTop = box.scrollHeight;
  }

  /* ---------- actions ---------- */
  async function onStart(e) {
    e.preventDefault();
    if (state.busy) return;
    var name = document.getElementById("rzSupName").value.trim();
    var phone = document.getElementById("rzSupPhone").value.trim();
    var subject = document.getElementById("rzSupSubject").value.trim();
    var message = document.getElementById("rzSupMsg").value.trim();
    if (!name || !phone || !message) return;
    state.busy = true;
    var btn = e.target.querySelector("button[type=submit]"); btn.disabled = true; btn.textContent = "Gönderiliyor...";
    var res = await Rezora.supportStart({ name: name, phone: phone, subject: subject, message: message });
    state.busy = false;
    if (!res.ok) { renderForm(res.error || "Gönderilemedi, tekrar deneyin."); return; }
    state.threadId = res.threadId;
    localStorage.setItem(LS_THREAD, state.threadId);
    await loadThread();
    renderChat();
    startPoll();
  }

  async function onSend(e) {
    e.preventDefault();
    if (state.busy) return;
    var input = document.getElementById("rzSupReplyInput");
    var text = input.value.trim();
    if (!text) return;
    state.busy = true; input.disabled = true;
    var res = await Rezora.supportSend(state.threadId, text);
    state.busy = false; input.disabled = false;
    if (!res.ok) {
      if (res.notFound) { resetThread(); return; }
      // kapandıysa veya hata: konuşmayı yenile
      await loadThread(); renderChat();
      return;
    }
    input.value = "";
    await loadThread();
    renderMsgs();
    input.focus();
  }

  function resetThread() {
    state.threadId = null; state.thread = null; state.msgs = [];
    localStorage.removeItem(LS_THREAD); localStorage.removeItem(LS_SEEN);
    stopPoll();
    renderForm();
  }

  async function loadThread() {
    if (!state.threadId) return;
    var data = await Rezora.supportFetch(state.threadId);
    if (!data || !data.thread) { // silinmiş/bulunamadı
      resetThread();
      return;
    }
    state.thread = data.thread;
    state.msgs = data.messages || [];
    updateBadge();
  }

  function adminCount() { return state.msgs.filter(function (m) { return m.sender === "admin"; }).length; }
  function updateBadge() {
    var seen = parseInt(localStorage.getItem(LS_SEEN) || "0", 10);
    var unread = Math.max(0, adminCount() - seen);
    if (state.open) { unread = 0; localStorage.setItem(LS_SEEN, String(adminCount())); }
    dotEl.style.display = unread > 0 ? "block" : "none";
  }

  /* ---------- polling ---------- */
  function startPoll() {
    stopPoll();
    state.timer = setInterval(async function () {
      if (!state.threadId) return;
      await loadThread();
      if (state.open) {
        // Konuşma kapandıysa footer'ı (yanıt kutusunu) tazele, yoksa sadece mesajları güncelle
        if (state.thread && state.thread.status === "closed" && document.getElementById("rzSupReply")) renderChat();
        else renderMsgs();
      }
    }, POLL_MS);
  }
  function stopPoll() { if (state.timer) { clearInterval(state.timer); state.timer = null; } }

  /* ---------- open/close ---------- */
  async function openPanel() {
    state.open = true;
    panel.classList.add("open");
    fab.classList.add("active");
    if (state.threadId) {
      bodyEl.innerHTML = '<div class="rz-sup-empty">Yükleniyor...</div>';
      await loadThread();
      if (state.threadId) { renderChat(); startPoll(); }
      else renderForm();
    } else {
      renderForm();
    }
    updateBadge();
  }
  function closePanel() {
    state.open = false;
    panel.classList.remove("open");
    fab.classList.remove("active");
    // arka planda yavaş yoklamayı sürdür (rozet için), thread varsa
    if (state.threadId && !state.timer) startPoll();
  }

  // Sayfa açılışında thread varsa rozet için arka planda yokla
  if (state.threadId) { loadThread().then(startPoll); }
})();
