/* ===========================================================
   Rezora — Bildirim Servisi (Notification Service)
   -----------------------------------------------------------
   Mesajların gönderim katmanı. ŞU AN: mock (sahte) gönderici.
   İLERİDE: WhatsApp Cloud API'ye geçilecek. Arayüz (send) aynı
   kalacağı için db.js / dashboard tarafında değişiklik gerekmez.

   Gerçek entegrasyon (örnek):
   --------------------------------------------------------
   POST https://graph.facebook.com/v19.0/<PHONE_NUMBER_ID>/messages
   Headers: Authorization: Bearer <ACCESS_TOKEN>, Content-Type: application/json
   Body: {
     messaging_product: "whatsapp",
     to: "<E164_PHONE>",
     type: "text",
     text: { body: "<mesaj metni>" }
   }
   Yanıt başarılıysa { status:"sent", providerId: <wamid> },
   hata olursa { status:"failed", error } döndürülmeli.
   GÜVENLİK: ACCESS_TOKEN tarayıcıya KONULMAMALI; gerçek gönderim
   bir Edge Function / sunucu üzerinden yapılmalı. Bu dosya o
   çağrının yapılacağı tek yer olacak şekilde tasarlandı.
   =========================================================== */

window.RezoraNotifier = (function () {
  // Sağlayıcı arayüzü: her sağlayıcı async send(message) -> {status, providerId?, error?}
  const MockProvider = {
    name: "mock",
    async send(message) {
      // ağ gecikmesi simülasyonu
      await new Promise((r) => setTimeout(r, 350));
      // Mock: her zaman başarılı. (Gerçekte API yanıtına göre belirlenecek.)
      return { status: "sent", providerId: "mock_" + Math.random().toString(36).slice(2, 10) };
    },
  };

  // Gelecekte: const WhatsAppCloudProvider = { name:"whatsapp_cloud", async send(message){ ...fetch... } };
  // Aktif sağlayıcıyı burada değiştirmen yeterli olacak:
  const provider = MockProvider;

  return {
    providerName: provider.name,
    async send(message) {
      if (!message) return { status: "failed", error: "no message" };
      try {
        const res = await provider.send(message);
        return res && res.status ? res : { status: "sent" };
      } catch (e) {
        return { status: "failed", error: (e && e.message) || "send error" };
      }
    },
  };
})();
