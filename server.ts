import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN || "DpCaqhewFFBqDtUNOlKVhFRaef7eMi0gMuxs9b/pyjQU3uLjjrDJr+1rNqYlfev04rBAkGvn7dqkb3w//rS2S5QRVfv5rjPI/WbgErrW/MyiLFlvCgY/hsyCVdnLYgtTfxvJM2e69AJ0Z44gwnDDPwdB04t89/1O/w1cDnyilFU=";
  const GROUP_ID = process.env.LINE_GROUP_ID || "C00acdebc56168801215e5bc7f4a86d90";

  // API to send Line Notification
  app.post("/api/notify-line", async (req, res) => {
    try {
      const { fullName, department, room, startDate, endDate, startTime, endTime, purpose, attendeesCount } = req.body;

      if (!fullName || !room || !startDate || !startTime || !endTime) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
      }

      const messageText = `📚 แจ้งขอใช้ห้อง HUB (✅ สำเร็จ)
━━━━━━━━━━━━━━━━━━
👤 ผู้ขอใช้: ${fullName}
🏢 กลุ่มสาระ/งาน: ${department || "-"}
📍 สถานที่: ${room}
📅 วันที่: ${startDate === endDate ? startDate : `${startDate} ถึง ${endDate}`}
🕘 เวลา: ${startTime} ถึง ${endTime} น.
🎯 จุดประสงค์: ${purpose || "-"}
👥 จำนวนผู้เข้าใช้: ${attendeesCount || 1} คน`;

      const response = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          to: GROUP_ID,
          messages: [
            {
              type: "text",
              text: messageText
            }
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("LINE Messaging API error response:", errText);
        return res.status(response.status).json({ success: false, error: errText });
      }

      const resData = await response.json();
      return res.json({ success: true, data: resData });
    } catch (err: any) {
      console.error("Error sending Line notification:", err);
      return res.status(500).json({ success: false, error: err.message || String(err) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
