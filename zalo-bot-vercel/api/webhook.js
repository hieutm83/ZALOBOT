export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("ok");
  }

  // verify secret
  const sig = req.headers["x-bot-api-secret-token"];
  if (!sig || sig !== process.env.SECRET_TOKEN) {
    return res.status(401).send("invalid secret");
  }

  const event = req.body || {};
  console.log("Webhook event:", event);

  // ví dụ: echo text nếu có
  if (event.message && event.message.text) {
    const userId = event.from.id;
    const replyText = `Chào ${event.from.display_name}, bạn vừa gửi: ${event.message.text}`;

    try {
      const axios = (await import("axios")).default;
      await axios.post(
        `https://bot-api.zapps.me/bot${process.env.BOT_TOKEN}/sendMessage`,
        {
          chat_id: userId,
          text: replyText,
        },
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (e) {
      console.error("SendMessage error:", e.response?.data || e.message);
    }
  }

  return res.status(200).send("ok");
}
