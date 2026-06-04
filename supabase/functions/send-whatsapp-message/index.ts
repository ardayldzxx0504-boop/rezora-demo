// @ts-nocheck
/* ============================================================
   Rezora — Supabase Edge Function: send-whatsapp-message
   ------------------------------------------------------------
   Amaç: messages tablosundaki bir mesajı WhatsApp Cloud API ile
   gönderir. WhatsApp TOKEN'ı YALNIZCA burada (Supabase secrets)
   bulunur; frontend'e veya repoya asla yazılmaz.

   Çağrı (dashboard'dan, kullanıcı JWT'si ile):
     supabase.functions.invoke("send-whatsapp-message",
       { body: { message_id: "<uuid>" } })

   Gerekli secrets (Supabase → Edge Functions → Secrets):
     WHATSAPP_TOKEN
     WHATSAPP_PHONE_NUMBER_ID
     WHATSAPP_API_VERSION   (örn. v19.0)
   Otomatik sağlanan (elle girilmez):
     SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

   Davranış:
   - Çağıran kullanıcı, mesajı RLS ile okuyabiliyorsa yetkili kabul edilir
     (işletme sahibi veya admin). Aksi halde 403.
   - Mesaj service role ile okunur, WhatsApp'a gönderilir.
   - Başarı -> messages.status = 'sent'; hata -> 'failed'.
   - Env eksikse SİSTEM ÇÖKMEZ: mesaj 'failed' yapılır ve anlaşılır
     bir hata mesajı döndürülür.
   ============================================================ */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function normalizePhone(p: string) {
  // E.164 için sadece rakam bırak (örn. "+90 533 ..." -> "90533...")
  return (p || "").replace(/[^\d]/g, "");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Yalnızca POST" }, 405);

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const ANON = Deno.env.get("SUPABASE_ANON_KEY");
    if (!SUPABASE_URL || !SERVICE_ROLE || !ANON) {
      return json({ status: "failed", error: "Sunucu yapılandırması eksik (Supabase env)." }, 500);
    }

    const { message_id } = await req.json().catch(() => ({}));
    if (!message_id) return json({ status: "failed", error: "message_id gerekli" }, 400);

    // 1) Yetki: çağıran kullanıcı bu mesajı RLS ile okuyabiliyor mu?
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: allowed } = await userClient
      .from("messages").select("id").eq("id", message_id).maybeSingle();
    if (!allowed) return json({ status: "failed", error: "Yetkisiz istek veya mesaj bulunamadı." }, 403);

    // 2) Mesajı service role ile oku
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: msg, error: readErr } = await admin
      .from("messages").select("*").eq("id", message_id).maybeSingle();
    if (readErr || !msg) return json({ status: "failed", error: "Mesaj bulunamadı." }, 404);

    // 3) WhatsApp env'leri
    const TOKEN = Deno.env.get("WHATSAPP_TOKEN");
    const PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    const API_VERSION = Deno.env.get("WHATSAPP_API_VERSION") || "v19.0";

    // 4) Env eksikse: failed + anlaşılır mesaj (çökmeden)
    if (!TOKEN || !PHONE_ID) {
      await admin.from("messages").update({ status: "failed" }).eq("id", message_id);
      return json({
        status: "failed",
        error: "WhatsApp yapılandırması eksik. Supabase secrets içine WHATSAPP_TOKEN ve WHATSAPP_PHONE_NUMBER_ID ekleyin.",
      });
    }

    // 5) WhatsApp Cloud API'ye gönder
    const to = normalizePhone(msg.to_phone);
    const resp = await fetch(`https://graph.facebook.com/${API_VERSION}/${PHONE_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: msg.text },
      }),
    });
    const result = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      await admin.from("messages").update({ status: "failed" }).eq("id", message_id);
      return json({
        status: "failed",
        error: result?.error?.message || `WhatsApp API hatası (HTTP ${resp.status})`,
      });
    }

    await admin.from("messages").update({ status: "sent" }).eq("id", message_id);
    return json({ status: "sent", providerId: result?.messages?.[0]?.id || null });
  } catch (e) {
    return json({ status: "failed", error: String((e && e.message) || e) });
  }
});
