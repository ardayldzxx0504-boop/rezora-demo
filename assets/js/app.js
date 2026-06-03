/* ===========================================================
   Rezora — Shared App Logic
   Nav, footer, icons, helpers, animations, toasts
   =========================================================== */

const LOGO = "assets/img/rezora-logo.png";

/* ----------------------------- Icons --------------------------------- */
const ICON = {
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.8 5.9 20.4l1.5-6.8L2.2 9l6.9-.7z"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.5-1.5 3-3.4 3-5.5A5.5 5.5 0 0 0 12 5 5.5 5.5 0 0 0 2 8.5c0 2.1 1.5 4 3 5.5l7 7Z"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h4l2 5-3 2a14 14 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A18 18 0 0 1 3 5a2 2 0 0 1 2-2Z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  checkCircle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><path d="m9 11 3 3L22 4"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>',
  trend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 17 6-6 4 4 8-8"/><path d="M21 7v6h-6"/></svg>',
  trendDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 7 6 6 4-4 8 8"/><path d="M21 17v-6h-6"/></svg>',
  money: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="3"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/></svg>',
  inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5 5h14l3 7v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6Z"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15l-1.4 5 5.1-1.3A10 10 0 1 0 12 2Zm5.8 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5-4.5-.2-.2-1.2-1.6-1.2-3s.7-2.1 1-2.4c.2-.3.5-.4.7-.4h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.4.5-.3.3c-.1.1-.3.3-.1.5.1.3.6 1 1.3 1.6.9.8 1.6 1 1.9 1.2.2.1.4.1.5-.1l.7-.8c.2-.2.3-.2.5-.1l1.9.9c.2.1.4.2.4.3.1.1.1.5-.1 1Z"/></svg>',
  message: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.5-.7L3 21l1.3-4A8.4 8.4 0 0 1 12 3.5a8.4 8.4 0 0 1 9 8Z"/></svg>',
  scissors: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 12.5 20 20M8.1 8.1 12 12"/></svg>',
  sparkles: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/></svg>',
  utensils: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 3v7a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3M6 12v9M16 3c-1.5 0-3 1.5-3 4s1.5 4 3 4v10"/></svg>',
  ball: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7l4 3-1.5 5h-5L8 10z"/><path d="M12 3v4M3.5 9l4 1M20.5 9l-4 1M6 20l2.5-4M18 20l-2.5-4"/></svg>',
  paw: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5.5" cy="11" r="2"/><circle cx="9.5" cy="6.5" r="2"/><circle cx="14.5" cy="6.5" r="2"/><circle cx="18.5" cy="11" r="2"/><path d="M12 12c-2.5 0-4.5 2-5 4-.4 1.6.8 3 2.5 3 .9 0 1.7-.3 2.5-.3s1.6.3 2.5.3c1.7 0 2.9-1.4 2.5-3-.5-2-2.5-4-5-4Z"/></svg>',
  wrench: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0 5 5l-9 9a2.8 2.8 0 0 1-4-4l9-9Z"/><path d="m18 2 4 4-3 1-2-2 1-3Z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
  twitter: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.5 8.6L23 22h-6.8l-5-6.6L5.5 22H2.3l8-9.2L1.5 2h7l4.5 6 5.9-6Zm-2.4 18h1.9L7.6 4H5.6l10.9 16Z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5A2.5 2.5 0 1 0 5 8.5a2.5 2.5 0 0 0 0-5ZM3 9h4v12H3V9Zm6 0h3.8v1.7h.05A4.2 4.2 0 0 1 16.6 9c3.2 0 4.4 2 4.4 5.2V21h-4v-5.4c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9V21H9V9Z"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></svg>',
};

function icon(name, cls) { return `<span class="ico${cls?' '+cls:''}">${ICON[name]||''}</span>`; }

/* Image helper: layered url with gradient fallback */
function imgStyle(id, w) {
  const url = `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w||800}&q=80`;
  return `background-image:url('${url}'),linear-gradient(135deg,#8B5CF6,#6D28D9)`;
}
function fmt(n) { return new Intl.NumberFormat('tr-TR').format(n); }
function money(n) { return '₺' + fmt(n); }
function qparam(k) { return new URLSearchParams(location.search).get(k); }

/* Reusable business card (price optional; tags from services) */
function bizCard(b, i) {
  i = i || 0;
  const tags = b.tags || (b.services ? b.services.slice(0,3).map(s => s.name) : []);
  let start = (typeof b.price === "number") ? b.price : null;
  if (start === null && b.services) {
    const prices = b.services.map(s => s.price).filter(p => p !== null && p !== undefined && p !== "");
    start = prices.length ? Math.min.apply(null, prices) : null;
  }
  const priceHtml = (start !== null)
    ? `<div class="biz-price">${money(start)} <span>'den başlayan</span></div>`
    : `<div class="biz-price"><span>Fiyat işletmede</span></div>`;
  return `
    <a class="biz-card reveal reveal-d${(i%3)+1}" href="business.html?id=${b.id}">
      <div class="biz-img" style="${imgStyle(b.img)}">
        <span class="biz-cat badge badge-ink">${b.categoryName}</span>
        <span class="biz-fav">${ICON.heart}</span>
        <span class="biz-rating rating"><span class="stars">★</span> ${b.rating} <span class="count">(${b.reviews})</span></span>
      </div>
      <div class="biz-body">
        <h3>${b.name}</h3>
        <div class="biz-meta">${ICON.pin} ${b.city}${b.area?(' · '+b.area):''}</div>
        <div class="biz-tags">${tags.map(t=>`<span class="tag">${t}</span>`).join("")}</div>
        <div class="biz-foot">
          ${priceHtml}
          <span class="btn btn-soft btn-sm">Rezerve et</span>
        </div>
      </div>
    </a>`;
}

/* Date helpers (Turkish) */
const TR_DAYS = ["Paz","Pzt","Sal","Çar","Per","Cum","Cmt"];
const TR_DAYS_FULL = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
const TR_MONTHS = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];

function isoOf(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function labelFromIso(iso) {
  const d = new Date(iso + "T00:00:00");
  return `${d.getDate()} ${TR_MONTHS[d.getMonth()]}`;
}
/* Relative day label (Bugün / Yarın / Dün / weekday) */
function relDay(iso) {
  const t = new Date();
  if (iso === isoOf(t)) return "Bugün";
  const ystr = new Date(t); ystr.setDate(t.getDate()-1);
  const tmr  = new Date(t); tmr.setDate(t.getDate()+1);
  if (iso === isoOf(tmr)) return "Yarın";
  if (iso === isoOf(ystr)) return "Dün";
  const d = new Date(iso + "T00:00:00");
  return `${TR_DAYS[d.getDay()]} ${d.getDate()} ${TR_MONTHS[d.getMonth()]}`;
}

/* Generate next N days; disabled if not a working day of the business */
function genDates(n, workingDays) {
  const open = workingDays && workingDays.length ? workingDays : [1,2,3,4,5,6];
  const out = [];
  const base = new Date();
  for (let i = 1; i <= n; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    out.push({
      iso: isoOf(d),
      key: `${d.getDate()} ${TR_MONTHS[d.getMonth()]}`,
      day: TR_DAYS[d.getDay()],
      num: d.getDate(),
      mon: TR_MONTHS[d.getMonth()],
      disabled: open.indexOf(d.getDay()) === -1,
    });
  }
  return out;
}

/* Generate time slots from open->close at the given interval (minutes) */
function genTimes(openTime, closeTime, stepMin) {
  const step = stepMin || 30;
  const [oh, om] = (openTime || "10:00").split(":").map(Number);
  const [ch, cm] = (closeTime || "20:00").split(":").map(Number);
  let cur = oh * 60 + om;
  const end = ch * 60 + cm;
  const out = [];
  while (cur < end) {
    out.push(`${String(Math.floor(cur/60)).padStart(2,"0")}:${String(cur%60).padStart(2,"0")}`);
    cur += step;
  }
  return out;
}

/* ----------------------------- Navbar -------------------------------- */
function buildNav(active) {
  const links = [
    { href: "businesses.html", key: "businesses", label: "İşletmeler" },
    { href: "business.html?id=elite-barber", key: "detail", label: "Keşfet" },
    { href: "dashboard.html", key: "dashboard", label: "İşletme Paneli" },
    { href: "notifications.html", key: "notifications", label: "Bildirimler" },
  ];
  const nav = document.createElement("nav");
  nav.className = "nav";
  nav.innerHTML = `
    <div class="container nav-inner">
      <a class="brand" href="index.html" aria-label="Rezora">
        <img src="${LOGO}" alt="Rezora — Akıllı Rezervasyon Platformu">
      </a>
      <div class="nav-links">
        ${links.map(l => `<a href="${l.href}" class="${active===l.key?'active':''}">${l.label}</a>`).join("")}
      </div>
      <div class="nav-cta">
        <a href="index.html#cta" class="btn btn-primary btn-sm btn-desktop">İşletmeni Ekle</a>
        <button class="btn btn-logout btn-sm btn-desktop" onclick="rezoraLogout()" title="Demodan çıkış yap">${ICON.logout} Çıkış</button>
        <button class="nav-toggle" id="navToggle" aria-label="Menü">${ICON.menu}</button>
      </div>
    </div>`;
  document.body.prepend(nav);

  // mobile drawer
  const backdrop = document.createElement("div");
  backdrop.className = "drawer-backdrop";
  backdrop.id = "drawerBackdrop";
  const drawer = document.createElement("aside");
  drawer.className = "drawer";
  drawer.id = "drawer";
  drawer.innerHTML = `
    <div class="d-head">
      <img src="${LOGO}" alt="Rezora" style="height:34px">
      <button class="nav-toggle" id="drawerClose" aria-label="Kapat">${ICON.x}</button>
    </div>
    ${links.map(l => `<a href="${l.href}" class="${active===l.key?'active':''}">${l.label}</a>`).join("")}
    <a href="index.html#cta" class="btn btn-primary btn-block" style="margin-top:16px">İşletmeni Ekle</a>
    <button class="btn btn-logout btn-block" style="margin-top:10px" onclick="rezoraLogout()">${ICON.logout} Demodan çıkış yap</button>`;
  document.body.append(backdrop, drawer);

  const open = () => { drawer.classList.add("open"); backdrop.classList.add("open"); };
  const close = () => { drawer.classList.remove("open"); backdrop.classList.remove("open"); };
  document.getElementById("navToggle").addEventListener("click", open);
  document.getElementById("drawerClose").addEventListener("click", close);
  backdrop.addEventListener("click", close);

  window.addEventListener("scroll", () => {
    nav.classList.toggle("scrolled", window.scrollY > 8);
  });
}

/* ----------------------------- Footer -------------------------------- */
function buildFooter() {
  const f = document.createElement("footer");
  f.className = "footer";
  f.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div>
          <a class="brand" href="index.html"><img src="${LOGO}" alt="Rezora"></a>
          <p class="f-about">Kuzey Kıbrıs'ın akıllı rezervasyon platformu. İşletmeler ve müşteriler için saniyeler içinde randevu.</p>
          <div class="footer-social" style="margin-top:18px">
            <a href="#" aria-label="Instagram">${ICON.instagram}</a>
            <a href="#" aria-label="Twitter">${ICON.twitter}</a>
            <a href="#" aria-label="LinkedIn">${ICON.linkedin}</a>
          </div>
        </div>
        <div>
          <h5>Platform</h5>
          <ul>
            <li><a href="businesses.html">İşletmeleri Keşfet</a></li>
            <li><a href="business.html?id=elite-barber">Örnek İşletme</a></li>
            <li><a href="dashboard.html">İşletme Paneli</a></li>
            <li><a href="notifications.html">Bildirimler</a></li>
          </ul>
        </div>
        <div>
          <h5>Kategoriler</h5>
          <ul>
            <li><a href="businesses.html?cat=barber">Berber</a></li>
            <li><a href="businesses.html?cat=salon">Kuaför</a></li>
            <li><a href="businesses.html?cat=restaurant">Restoran</a></li>
            <li><a href="businesses.html?cat=halisaha">Halı Saha</a></li>
          </ul>
        </div>
        <div>
          <h5>Şirket</h5>
          <ul>
            <li><a href="#">Hakkımızda</a></li>
            <li><a href="#">Fiyatlandırma</a></li>
            <li><a href="#">İletişim</a></li>
            <li><a href="#">Gizlilik</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© 2026 Rezora. Lefkoşa, Kuzey Kıbrıs (KKTC). Tüm hakları saklıdır.</span>
        <span>Akıllı Rezervasyon Platformu · Yatırımcı Destekli Demo</span>
      </div>
    </div>`;
  document.body.append(f);
}

/* ----------------------------- Reveal anim --------------------------- */
function initReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) { els.forEach(e=>e.classList.add("in")); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  els.forEach(e => io.observe(e));
}

/* ----------------------------- Toast --------------------------------- */
function toast(msg, type) {
  let wrap = document.querySelector(".toast-wrap");
  if (!wrap) { wrap = document.createElement("div"); wrap.className = "toast-wrap"; document.body.append(wrap); }
  const t = document.createElement("div");
  t.className = "toast " + (type||"ok");
  t.innerHTML = `${type==="ok"||!type?ICON.checkCircle:ICON.bell}<span>${msg}</span>`;
  wrap.append(t);
  setTimeout(() => { t.style.opacity = "0"; t.style.transform = "translateX(40px)"; t.style.transition="all .3s"; setTimeout(()=>t.remove(), 320); }, 2800);
}

/* ----------------------------- Reservation store --------------------- */
const Store = {
  set(data) { try { sessionStorage.setItem("rezora_booking", JSON.stringify(data)); } catch(e){} },
  get() { try { return JSON.parse(sessionStorage.getItem("rezora_booking")) || {}; } catch(e){ return {}; } },
};

/* ----------------------------- Bootstrap ----------------------------- */
function initLayout(active) {
  buildNav(active);
}
document.addEventListener("DOMContentLoaded", () => { initReveal(); });
