import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Use POST" });
  }

  const { url, secret_token } = req.body || {};
  if (!url || !secret_token) {
    return res.status(400).json({ ok: false, error: "Missing url or secret_token" });
  }

  try {
    const entrypoint = `https://bot-api.zapps.me/bot${process.env.BOT_TOKEN}/setWebhook`;
    const { data } = await axios.post(entrypoint, { url, secret_token });
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.response?.data || e.message });
  }
}
