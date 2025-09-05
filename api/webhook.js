import axios from "axios";
import OpenAI from "openai";
import { google } from "googleapis";

// Hàm đọc credentials từ ENV
function getGoogleCreds() {
  const b64 = process.env.GOOGLE_CREDENTIALS_B64;
  const json = Buffer.from(b64, "base64").toString("utf8");
  return JSON.parse(json);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).send("ok");

  // 1. Verify secret
  const sig = req.headers["x-bot-api-secret-token"];
  if (sig !== process.env.SECRET_TOKEN) return res.status(401).send("invalid secret");

  const event = req.body || {};
  const userId = event?.from?.id;
  const userText = event?.message?.text || "";
  if (!userId || !userText) return res.status(200).send("ok");

  // 2. Check policy
  const banned = ["ck", "chuyen khoan", "bank", "ngan hang", "zalo", "facebook", "tiktok", "lazada", "tiki", "dm", "vl"];
  const lower = userText.toLowerCase();
  if (banned.some(w => lower.includes(w))) {
    await axios.post(`https://bot-api.zapps.me/bot${process.env.BOT_TOKEN}/sendMessage`, {
      chat_id: userId,
      text: "Mình chỉ hỗ trợ mua hàng trực tiếp trên sàn nhé. Bạn bấm 'Mua ngay' trong ứng dụng để đặt ạ!"
    });
    return res.status(200).send("ok");
  }

  // 3. Google Sheet Q&A
  let reply = null;
  try {
    const creds = getGoogleCreds();
    const jwt = new google.auth.JWT(creds.client_email, null, creds.private_key, [
      "https://www.googleapis.com/auth/spreadsheets.readonly"
    ]);
    const sheets = google.sheets({ version: "v4", auth: jwt });
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: "QnA!A:B"
    });
    const rows = resp.data.values || [];
    for (const [q, a] of rows) {
      if (userText.toLowerCase().includes(q.toLowerCase())) {
        reply = a;
        break;
      }
    }
  } catch (e) {
    console.error("Sheets error", e.message);
  }

  // 4. ChatGPT fallback
  if (!reply) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Bạn là nhân viên tư vấn Trà Thư Dạ, hãy trả lời thân thiện, chốt đơn khéo léo, tuân thủ chính sách sàn." },
        { role: "user", content: userText }
      ]
    });
    reply = completion.choices[0].message.content.trim();
  }

  // 5. Gửi reply về Zalo
  await axios.post(`https://bot-api.zapps.me/bot${process.env.BOT_TOKEN}/sendMessage`, {
    chat_id: userId,
    text: reply
  });

  return res.status(200).send("ok");
}
