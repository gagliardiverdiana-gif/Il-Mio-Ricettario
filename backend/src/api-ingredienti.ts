import { Router, Request, Response } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import pool from "./connessione-db";
import { HttpError, leggiId } from "./errori";

const router = Router();

const UNITA_AMMESSE = ["g", "kg", "ml", "cl", "l", "pz", "cucchiaio", "cucchiaino", "q.b"];

interface DatiIngrediente {
  nome: string;
  quantita: number;
  unita: string;
  descrizione: string | null;
}

/** Valida il corpo della richiesta per creazione e modifica. */
function validaIngrediente(body: unknown): DatiIngrediente {
  const b = (body ?? {}) as Record<string, unknown>;
  const nome = typeof b.nome === "string" ? b.nome.trim() : "";
  const quantita = Number(b.quantita);
  const unita = typeof b.unita === "string" ? b.unita.trim().toLowerCase() : "";
  const descrizione =
    typeof b.descrizione === "string" && b.descrizione.trim() !== ""
      ? b.descrizione.trim()
      : null;

  if (nome === "" || nome.length > 255) {
    throw new HttpError(400, "Il nome è obbligatorio (max 255 caratteri)");
  }
  if (!Number.isFinite(quantita) || quantita < 0) {
    throw new HttpError(400, "La quantità deve essere un numero maggiore o uguale a 0");
  }
  if (!UNITA_AMMESSE.includes(unita)) {
    throw new HttpError(400, `Unità non valida. Ammesse: ${UNITA_AMMESSE.join(", ")}`);
  }
  return { nome, quantita, unita, descrizione };
}

// Elenco con stato delle scorte e indicazione se l'ingrediente è eliminabile
router.get("/", async (_req: Request, res: Response) => {
  const [righe] = await pool.query<RowDataPacket[]>(`
    SELECT i.id, i.nome, i.quantita, i.unita, i.descrizione,
      CASE
        WHEN i.quantita <= 0 THEN 'ESAURITO'
        WHEN i.unita = 'g'  AND i.quantita < 500 THEN 'POCO'
        WHEN i.unita = 'kg' AND i.quantita < 2   THEN 'POCO'
        WHEN i.unita = 'pz' AND i.quantita < 15  THEN 'POCO'
        WHEN i.unita = 'ml' AND i.quantita < 200 THEN 'POCO'
        WHEN i.unita = 'cl' AND i.quantita < 20  THEN 'POCO'
        WHEN i.unita = 'l'  AND i.quantita < 1   THEN 'POCO'
        WHEN i.unita IN ('cucchiaio', 'cucchiaino') AND i.quantita < 10 THEN 'POCO'
        ELSE 'OK'
      END AS stato,
      NOT EXISTS (
        SELECT 1 FROM ricetta_ingrediente ri WHERE ri.ingrediente_id = i.id
      ) AS puoEliminare
    FROM ingredienti i
    ORDER BY i.nome
  `);
  res.json(righe.map((r) => ({ ...r, puoEliminare: Boolean(r.puoEliminare) })));
});

// Dettaglio singolo
router.get("/:id", async (req: Request, res: Response) => {
  const id = leggiId(req.params.id);
  const [righe] = await pool.query<RowDataPacket[]>(
    `SELECT i.*,
       NOT EXISTS (
         SELECT 1 FROM ricetta_ingrediente ri WHERE ri.ingrediente_id = i.id
       ) AS puoEliminare
     FROM ingredienti i WHERE i.id = ?`,
    [id],
  );
  if (righe.length === 0) {
    throw new HttpError(404, "Ingrediente non trovato");
  }
  res.json({ ...righe[0], puoEliminare: Boolean(righe[0].puoEliminare) });
});

// Creazione: la quantità indicata è la scorta iniziale
router.post("/", async (req: Request, res: Response) => {
  const { nome, quantita, unita, descrizione } = validaIngrediente(req.body);
  const [risultato] = await pool.execute<ResultSetHeader>(
    "INSERT INTO ingredienti (nome, quantita, unita, descrizione) VALUES (?, ?, ?, ?)",
    [nome, quantita, unita, descrizione],
  );
  res.status(201).json({ id: risultato.insertId });
});

// Modifica (es. rifornimento scorte o correzione dei dati)
router.put("/:id", async (req: Request, res: Response) => {
  const id = leggiId(req.params.id);
  const { nome, quantita, unita, descrizione } = validaIngrediente(req.body);
  const [risultato] = await pool.execute<ResultSetHeader>(
    "UPDATE ingredienti SET nome = ?, quantita = ?, unita = ?, descrizione = ? WHERE id = ?",
    [nome, quantita, unita, descrizione, id],
  );
  if (risultato.affectedRows === 0) {
    throw new HttpError(404, "Ingrediente non trovato");
  }
  res.json({ success: true });
});

// Eliminazione: bloccata dal database se l'ingrediente è usato in una ricetta
router.delete("/:id", async (req: Request, res: Response) => {
  const id = leggiId(req.params.id);
  try {
    const [risultato] = await pool.execute<ResultSetHeader>(
      "DELETE FROM ingredienti WHERE id = ?",
      [id],
    );
    if (risultato.affectedRows === 0) {
      throw new HttpError(404, "Ingrediente non trovato");
    }
    res.json({ success: true });
  } catch (err: unknown) {
    // 1451 = ER_ROW_IS_REFERENCED_2: violazione della foreign key RESTRICT
    if ((err as { errno?: number }).errno === 1451) {
      throw new HttpError(409, "Ingrediente usato in una o più ricette: non eliminabile");
    }
    throw err;
  }
});

export default router;
