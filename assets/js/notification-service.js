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

  async function send(message) {
    if (!message || !message.id) return { status: "failed", error: "Geçersiz mesaj" };
    const sb = (typeof Rezora !== "undefined" && Rezora.client) ? Rezora.client() : null;
    if (!sb) return { status: "failed", error: "Supabase istemcisi hazır değil" };
    try {
      const { data, error } = await sb.functions.invoke(FUNCTION_NAME, {
        body: { message_id: message.id },
      });
      if (error) {
        return { status: "failed", error: error.message || "Edge Function çağrısı başarısız" };
      }
      return {
        status: (data && data.status) || "sent",
        providerId: data && data.providerId,
        error: data && data.error,
      };
    } catch (e) {
      return { status: "failed", error: (e && e.message) || "Gönderim hatası" };
    }
  }

  return { providerName: "whatsapp_cloud_edge", send };
})();
