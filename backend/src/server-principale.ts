import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { RowDataPacket } from "mysql2/promise";
import pool from "./connessione-db";
import apiIngredienti from "./api-ingredienti";
import apiRicette from "./api-ricette";
import { gestoreErrori } from "./errori";

dotenv.config();
const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  }),
);

app.use(express.json({ limit: "100kb" }));

app.use("/api/ingredienti", apiIngredienti);
app.use("/api/ricette", apiRicette);

// Statistiche reali per la Home
app.get("/api/stats", async (_req: Request, res: Response) => {
  const [righe] = await pool.query<RowDataPacket[]>(`
    SELECT
      (SELECT COUNT(*) FROM ricette)     AS totalRicette,
      (SELECT COUNT(*) FROM ingredienti) AS totalIngredienti
  `);
  res.json({
    totalRicette: Number(righe[0].totalRicette),
    totalIngredienti: Number(righe[0].totalIngredienti),
  });
});

// Health check: verifica anche la connessione al database
app.get("/api/health", async (_req: Request, res: Response) => {
  await pool.query("SELECT 1");
  res.json({ stato: "ok", timestamp: new Date().toISOString() });
});

// Rotte inesistenti
app.use((_req: Request, res: Response) => {
  res.status(404).json({ errore: "Rotta non trovata" });
});

// Deve essere registrato per ultimo
app.use(gestoreErrori);

app.listen(PORT, () => {
  console.log(`Server avviato su http://localhost:${PORT}`);
});
