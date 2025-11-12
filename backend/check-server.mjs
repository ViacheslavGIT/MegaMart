import net from "net";
import mongoose from "mongoose";
import WebSocket from "ws";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

// 🧠 Перевірка MongoDB
async function checkMongo() {
  if (!MONGO_URI) {
    console.log("⚠️  В .env немає MONGO_URI");
    return;
  }
  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB підключено:", conn.connection.host);
    await mongoose.disconnect();
  } catch (err) {
    console.log("❌ MongoDB не вдалося підключити:", err.message);
  }
}

// 🔌 Перевірка порту
function checkPort() {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.log(`❌ Порт ${PORT} вже зайнятий`);
      } else {
        console.log("⚠️  Помилка перевірки порту:", err.message);
      }
      resolve(false);
    });
    server.once("listening", () => {
      console.log(`✅ Порт ${PORT} вільний`);
      server.close();
      resolve(true);
    });
    server.listen(PORT);
  });
}

// 🌐 Перевірка WebSocket
async function checkWebSocket() {
  try {
    const ws = new WebSocket(`ws://localhost:${PORT}`);
    const timeout = setTimeout(() => {
      console.log("❌ WebSocket не відповідає");
      ws.terminate();
    }, 2000);
    ws.on("open", () => {
      clearTimeout(timeout);
      console.log("✅ WebSocket з'єднання встановлено");
      ws.close();
    });
  } catch (err) {
    console.log("⚠️  WebSocket помилка:", err.message);
  }
}

(async () => {
  console.log("🔍 Перевірка середовища MegaMart...\n");
  await checkMongo();
  await checkPort();
  await checkWebSocket();
})();
