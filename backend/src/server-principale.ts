import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiIngredienti from "./api-ingredienti";
import apiRicette from "./api-ricette";

dotenv.config();
const app = express();
const PORT = Number(process.env.PORT) || 3001;

// 🔧 FIX CORS per React localhost:3000
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "10mb" }));

// 🔧 ROTTE ESISTENTI
app.use("/api/ingredienti", apiIngredienti);
app.use("/api/ricette", apiRicette);

// 🔥 NUOVE ROTTE HOME
app.get("/api/descrizione", (req, res) => {
  res.json({ descrizione: "Benvenuto nel Ricettario! 🍝👨‍🍳" });
});

app.post("/api/descrizione", (req, res) => {
  console.log("💾 Descrizione salvata:", req.body.descrizione);
  res.json({ success: true });
});

app.get("/api/stats", (req, res) => {
  res.json({
    totalRicette: 12,
    totalIngredienti: 35,
  });
});

app.get("/test", (req, res) => {
  res.json({
    messaggio: "🟢 Backend Ricettario OK!",
    timestamp: new Date().toISOString(),
    routes: [
      "/api/ricette",
      "/api/ingredienti",
      "/api/descrizione",
      "/api/stats",
    ],
  });
});

app.listen(PORT, () => {
  console.log(`🟢 Server: http://localhost:${PORT}`);
  console.log(`🧪 Test: http://localhost:${PORT}/test`);
});
