/* ===========================================================
   Rezora — Bildirim Servisi (Notification Service)
   -----------------------------------------------------------
   Gönderim, Supabase Edge Function "send-whatsapp-message"
   üzerinden yapılır. WhatsApp TOKEN'ı YALNIZCA Edge Function
   içinde (Supabase secrets) bulunur — frontend'e ve repoya
   asla yazılmaz.

   send(message): { status: "sent" | "failed", providerId?, error? }
   - Edge Function mesajı DB'den okur, WhatsApp'a gönderir ve
     messages.status alanını günceller.
   - Function deploy edilmemiş ya da env eksikse: hata fırlatmaz,
     { status: "failed", error } döner (UI'da anlaşılır gösterilir).

   Gerekli Supabase secrets (Edge Functions → Secrets):
     WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_API_VERSION
   =========================================================== */

window.RezoraNotifier = (function () {
  const FUNCTION_NAME = "send-whatsapp-message";

  // Hata mesajını ekranda toast olarak gösterir (toast varsa).
  function showError(msg) {
    if (typeof window !== "undefined" && typeof window.toast === "function") {
      window.toast("Mesaj gönderilemedi: " + (msg || "bilinmeyen hata"), "bell");
    }
  }

  // Edge Function non-2xx döndürdüğünde gövdedeki gerçek hatayı çıkarmaya çalışır.
  async function extractError(error) {
    let detail = error && error.message;
    try {
      if (error && error.context && typeof error.context.json === "function") {
        const body = await error.context.json();
        if (body && body.error) detail = body.error;
      }
    } catch (_) { /* yok say */ }
    return detail || "Edge Function çağrısı başarısız";
  }

  async function send(message) {
    if (!message || !message.id) { showError("Geçersiz mesaj"); return { status: "failed", error: "Geçersiz mesaj" }; }
    const sb = (typeof Rezora !== "undefined" && Rezora.client) ? Rezora.client() : null;
    if (!sb) { showError("Supabase istemcisi hazır değil"); return { status: "failed", error: "Supabase istemcisi hazır değil" }; }
    try {
      const { data, error } = await sb.functions.invoke(FUNCTION_NAME, {
        body: { message_id: message.id },
      });
      if (error) {
        const detail = await extractError(error);
        showError(detail);
        return { status: "failed", error: detail };
      }
      const result = {
        status: (data && data.status) || "sent",
        providerId: data && data.providerId,
        error: data && data.error,
      };
      if (result.status === "failed") showError(result.error);
      return result;
    } catch (e) {
      const detail = (e && e.message) || "Gönderim hatası";
      showError(detail);
      return { status: "failed", error: detail };
    }
  }

  return { providerName: "whatsapp_cloud_edge", send };
})();
