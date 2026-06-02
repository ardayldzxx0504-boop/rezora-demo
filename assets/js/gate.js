/* ===========================================================
   Rezora — Demo Access Gate
   Full-screen password lock shown before any page content.
   Loaded in <head> so it covers the page before it renders.
   =========================================================== */
(function () {
  var PASSWORD = "rezora2026";
  var KEY = "rezora_access";

  function isGranted() {
    try { return localStorage.getItem(KEY) === "granted"; } catch (e) { return false; }
  }

  // Expose logout for the nav button
  window.rezoraLogout = function () {
    try { localStorage.removeItem(KEY); } catch (e) {}
    location.reload();
  };

  if (isGranted()) return; // already authorized — show the demo normally

  // Lock scrolling while the gate is up
  document.documentElement.classList.add("rz-noscroll");

  var lockSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
  var keySvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="5"/><path d="m12.5 11.5 8-8M17 7l2 2M14 6l2 2"/></svg>';
  var shieldSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>';

  var gate = document.createElement("div");
  gate.className = "rz-gate";
  gate.id = "rzGate";
  gate.innerHTML =
    '<div class="rz-gate-card">' +
      '<img class="rz-gate-logo" src="assets/img/rezora-logo.png" alt="Rezora">' +
      '<div class="rz-gate-lock">' + lockSvg + '</div>' +
      '<h2>Demo Erişimi</h2>' +
      '<p class="sub">Devam etmek için erişim şifresini gir.</p>' +
      '<form id="rzGateForm" autocomplete="off">' +
        '<div class="rz-gate-field">' + keySvg +
          '<input class="rz-gate-input" id="rzGateInput" type="password" placeholder="Şifre" aria-label="Şifre" autofocus>' +
        '</div>' +
        '<div class="rz-gate-error" id="rzGateError">Şifre hatalı</div>' +
        '<button class="btn btn-primary btn-block btn-lg" type="submit">Giriş Yap</button>' +
      '</form>' +
      '<div class="rz-gate-note">' + shieldSvg + ' Bu demo yalnızca yetkili kişiler içindir.</div>' +
    '</div>';

  // Append to <html> immediately (body may not exist yet)
  (document.body || document.documentElement).appendChild(gate);

  function wire() {
    var form = document.getElementById("rzGateForm");
    var input = document.getElementById("rzGateInput");
    var error = document.getElementById("rzGateError");
    if (!form) return;
    if (input) setTimeout(function () { try { input.focus(); } catch (e) {} }, 60);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (input.value === PASSWORD) {
        try { localStorage.setItem(KEY, "granted"); } catch (e) {}
        document.documentElement.classList.remove("rz-noscroll");
        gate.style.transition = "opacity .35s ease";
        gate.style.opacity = "0";
        setTimeout(function () { if (gate.parentNode) gate.parentNode.removeChild(gate); }, 360);
      } else {
        error.classList.add("show");
        input.classList.add("err");
        input.value = "";
        input.focus();
      }
    });

    input.addEventListener("input", function () {
      error.classList.remove("show");
      input.classList.remove("err");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
})();
