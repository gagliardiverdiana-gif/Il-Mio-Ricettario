import { Router, Request, Response } from "express";
import pool from "./connessione-db";

const router = Router();

// 1. GET tutti ingredienti + giacenza + stato REAL
router.get("/", async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT id, nome, quantita, unita, descrizione, COALESCE(giacenza, 0) as giacenza,
        CASE 
          WHEN giacenza <= 0 THEN '🛑 ESAURITO'
          WHEN unita = 'g' AND giacenza < 500 THEN '⚠️ POCO'
          WHEN unita = 'kg' AND giacenza < 2 THEN '⚠️ POCO'
          WHEN unita = 'pz' AND giacenza < 15 THEN '⚠️ POCO'
          WHEN unita = 'ml' AND giacenza < 200 THEN '⚠️ POCO'
          WHEN unita = 'cl' AND giacenza < 20 THEN '⚠️ POCO'
          WHEN unita IN ('cucchiaio', 'cucchiaino') AND giacenza < 10 THEN '⚠️ POCO'
          ELSE '✅ OK'
        END as stato
      FROM ingredienti 
      ORDER BY nome
    `);
    console.log("📦 Ingredienti stock:", rows.length);
    res.json(rows);
  } catch (error: any) {
    console.error("GET ingredienti errore:", error);
    res.status(500).json({ errore: "Database errore" });
  }
});

// 2. GET singolo + check eliminabile (invariato)
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const [ingrediente]: any = await pool.query(
      "SELECT * FROM ingredienti WHERE id = ?",
      [req.params.id],
    );

    if (
      !ingrediente ||
      (Array.isArray(ingrediente) && ingrediente.length === 0)
    ) {
      return res.status(404).json({ errore: "Ingrediente non trovato" });
    }

    const [uso]: any = await pool.query(
      "SELECT COUNT(*) as usato FROM ricetta_ingredienti WHERE ingrediente_id = ?",
      [Number(req.params.id)],
    );

    const ingredienteData = Array.isArray(ingrediente)
      ? ingrediente[0]
      : ingrediente;

    res.json({
      ...ingredienteData,
      puoEliminare: (uso[0]?.usato || 0) === 0,
    });
  } catch (error: any) {
    console.error("GET ingrediente errore:", error);
    res.status(500).json({ errore: error.message });
  }
});

// 3. POST nuovo ingrediente (giacenza=0)
router.post("/", async (req: Request, res: Response) => {
  try {
    const { nome, quantita, unita, descrizione } = req.body;
    const [result]: any = await pool.query(
      "INSERT INTO ingredienti (nome, quantita, unita, descrizione, giacenza) VALUES (?, ?, ?, ?, 0)",
      [nome, quantita, unita, descrizione || null],
    );
    res.status(201).json({ id: result.insertId });
  } catch (error: any) {
    res.status(500).json({ errore: "Salvataggio fallito" });
  }
});

// 4. DELETE singolo
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const [result]: any = await pool.query(
      "DELETE FROM ingredienti WHERE id = ?",
      [req.params.id],
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ errore: "Ingrediente non trovato" });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ errore: "Eliminazione fallita" });
  }
});

export default router;
