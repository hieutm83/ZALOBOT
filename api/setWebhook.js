import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const { url, secret_token } = req.body;
  const entrypoint = `https://bot-api.zapps.me/bot${process.env.BOT_TOKEN}/setWebhook`;
  const { data } = await axios.post(entrypoint, { url, secret_token });
  res.status(200).json(data);
}
