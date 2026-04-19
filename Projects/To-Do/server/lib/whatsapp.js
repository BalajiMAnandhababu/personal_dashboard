export async function sendWhatsApp(message) {
  if (!process.env.WHAPI_TOKEN) {
    console.warn('[WhatsApp] WHAPI_TOKEN not set — skipping send');
    console.log('[WhatsApp] Message would have been:\n' + message);
    return null;
  }

  const response = await fetch(`${process.env.WHAPI_API_URL}/messages/text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.WHAPI_TOKEN}`,
    },
    body: JSON.stringify({
      to: process.env.BABAJI_WHATSAPP_NUMBER,
      body: message,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('[WhatsApp] Send failed:', data);
  } else {
    console.log('[WhatsApp] Sent successfully:', data?.id ?? JSON.stringify(data));
  }

  return data;
}
