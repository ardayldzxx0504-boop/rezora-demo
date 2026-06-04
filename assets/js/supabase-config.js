/* ===========================================================
   Rezora — Supabase Yapılandırması
   -----------------------------------------------------------
   Buraya kendi Supabase projenin değerlerini gir:
   Supabase Dashboard → Project Settings → API
     - Project URL        -> SUPABASE_URL
     - Project API keys → anon public  -> SUPABASE_ANON_KEY
   Değerleri girdikten sonra site otomatik olarak Supabase'e bağlanır.
   (anon key tarayıcıda güvenle kullanılır; gerçek koruma RLS iledir.)
   =========================================================== */
window.SUPABASE_URL = "https://owtqcilbnbjfafjsodiz.supabase.co";
window.SUPABASE_ANON_KEY = "sb_publishable_wkN-EkmH99uBHyu4hLnHbw_NEMMdQn2";

window.SUPABASE_CONFIGURED =
  !!window.SUPABASE_URL &&
  !!window.SUPABASE_ANON_KEY &&
  window.SUPABASE_URL.indexOf("YOUR-PROJECT-REF") === -1 &&
  window.SUPABASE_ANON_KEY.indexOf("YOUR-ANON") === -1;
