import { Router, Request, Response } from "express";
import pool from "./connessione-db";

// Tipo per gli ingredienti ricevuti dal frontend
interface IngredienteInput {
  ingredienteId: string | number;
  quantita: string | number;
  unita: string;
  nome?: string;
}

interface IngredienteNumerico {
  ingredienteId: number;
  quantita: number;
  unita: string;
  nome?: string;
}

const router = Router();

// 1. GET tutte ricette (invariato ✅)
router.get("/", async (req: Request, res: Response) => {
  try {
    const [ricette]: any[] = await pool.query(`
      SELECT r.*, 
        COALESCE(GROUP_CONCAT(CONCAT(i.nome, ' (', ri.quantita, ri.unita, ')') SEPARATOR ', '), 'Nessuno') as ingredienti_nomi
      FROM ricette r 
      LEFT JOIN ricetta_ingrediente ri ON r.id = ri.ricetta_id 
      LEFT JOIN ingredienti i ON ri.ingrediente_id = i.id 
      GROUP BY r.id
    `);
    console.log("📤 GET ricette:", ricette.length);
    res.json(ricette || []); // ✅ Sempre array
  } catch (error: any) {
    console.error("GET errore:", error);
    res.json([]); // ✅ Array vuoto su errore
  }
});

// 2. POST CREATE + junction + stock ✅ FIXATO
router.post("/", async (req: Request, res: Response) => {
  let conn: any = null;
  try {
    const { nome, istruzioni, difficolta, ingredienti } = req.body as {
      nome: string;
      istruzioni?: string;
      difficolta?: string;
      ingredienti?: IngredienteInput[];
    };

    // Converti ingredienti a tipo numerico
    const ingredientiNumerici: IngredienteNumerico[] = (ingredienti || []).map(
      (ing: IngredienteInput) => ({
        ...ing,
        ingredienteId: Number(ing.ingredienteId),
        quantita: Number(ing.quantita),
        unita: ing.unita || "",
      }),
    );

    console.log("📥 POST ricevuto:", {
      nome,
      numIng: ingredientiNumerici.length,
      esempio: ingredientiNumerici[0]
        ? `${ingredientiNumerici[0].quantita}${ingredientiNumerici[0].unita}`
        : "nessuno",
    });

    // Transazione
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // 1. Inserisci ricetta
    const [ricettaRes] = (await conn.execute(
      "INSERT INTO ricette (nome, istruzioni, difficolta) VALUES (?, ?, ?)",
      [nome, istruzioni, difficolta || "facile"],
    )) as any;
    const ricettaId = ricettaRes.insertId;
    console.log(`✅ Ricetta "${nome}" creata ID: ${ricettaId}`);

    // 2. Junction + Scala stock (TUTTO IN TRANSAZIONE)
    for (const ing of ingredientiNumerici) {
      const { ingredienteId, quantita, unita } = ing;

      if (isNaN(quantita) || quantita <= 0) {
        throw new Error(
          `Quantità non valida per ID ${ingredienteId}: ${quantita}`,
        );
      }

      // Check stock (log, no throw)
      const [stockCheck] = (await conn.execute(
        "SELECT quantita FROM ingredienti WHERE id = ?", // ✅ quantita non giacenza
        [ingredienteId],
      )) as any[];
      const giacenza = Number(stockCheck[0]?.quantita || 0);
      console.log(
        `📊 Stock ID${ingredienteId} ("${ing.nome || "N/D"}"): ${giacenza}g - ${quantita} = ${giacenza - quantita}`,
      );

      // Inserisci junction
      await conn.execute(
        "INSERT INTO ricetta_ingrediente (ricetta_id, ingrediente_id, quantita, unita) VALUES (?, ?, ?, ?)",
        [ricettaId, ingredienteId, quantita, unita],
      );

      // Scala stock (GREATEST evita negativo)
      const [stockUpdate] = (await conn.execute(
        "UPDATE ingredienti SET quantita = GREATEST(0, quantita - ?) WHERE id = ?",
        [quantita, ingredienteId],
      )) as any;
      console.log(
        `✅ Scala ${quantita}${unita} da ID${ingredienteId}. Affected: ${stockUpdate.affectedRows}`,
      );
    }

    await conn.commit();
    res.status(201).json({ success: true, id: ricettaId });
  } catch (error: any) {
    if (conn) await conn.rollback();
    console.error("❌ POST /ricette:", error.message);
    res.status(500).json({ errore: error.message });
  } finally {
    if (conn) conn.release();
  }
});

// 3. DELETE (invariato, funziona)
router.delete("/:id", async (req: Request, res: Response) => {
  let conn: any = null;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [junctions]: any[] = await conn.query(
      "SELECT ri.ingrediente_id, ri.quantita FROM ricetta_ingrediente ri WHERE ri.ricetta_id = ?",
      [Number(req.params.id)],
    );

    // Ripristina stock (usa quantita)
    if (junctions.length > 0) {
      for (const j of junctions) {
        await conn.execute(
          "UPDATE ingredienti SET quantita = quantita + ? WHERE id = ?",
          [j.quantita, j.ingrediente_id],
        );
      }
      console.log(`📈 Stock ripristinato: ${junctions.length} ingredienti`);
    }

    await conn.execute("DELETE FROM ricette WHERE id = ?", [req.params.id]);
    await conn.commit();

    console.log("🗑️ Ricetta eliminata ID:", req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    if (conn) await conn.rollback();
    console.error("DELETE errore:", error);
    res.status(500).json({ errore: error.message });
  } finally {
    if (conn) conn.release();
  }
});

export default router;
