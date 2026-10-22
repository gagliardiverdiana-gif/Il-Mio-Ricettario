import { Router, Request, Response } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import pool, { inTransazione } from "./connessione-db";
import { HttpError, leggiId } from "./errori";
import { convertiQuantita } from "./unita";

const router = Router();

const DIFFICOLTA_AMMESSE = ["facile", "media", "difficile"];

interface IngredienteRicetta {
  ingredienteId: number;
  quantita: number;
  unita: string;
}

interface DatiRicetta {
  nome: string;
  istruzioni: string;
  difficolta: string;
}

function validaDatiRicetta(body: unknown): DatiRicetta {
  const b = (body ?? {}) as Record<string, unknown>;
  const nome = typeof b.nome === "string" ? b.nome.trim() : "";
  const istruzioni = typeof b.istruzioni === "string" ? b.istruzioni.trim() : "";
  const difficolta = typeof b.difficolta === "string" ? b.difficolta : "facile";

  if (nome === "" || nome.length > 255) {
    throw new HttpError(400, "Il nome è obbligatorio (max 255 caratteri)");
  }
  if (istruzioni === "") {
    throw new HttpError(400, "Le istruzioni sono obbligatorie");
  }
  if (!DIFFICOLTA_AMMESSE.includes(difficolta)) {
    throw new HttpError(400, `Difficoltà non valida. Ammesse: ${DIFFICOLTA_AMMESSE.join(", ")}`);
  }
  return { nome, istruzioni, difficolta };
}

function validaIngredienti(valore: unknown): IngredienteRicetta[] {
  if (valore === undefined) return [];
  if (!Array.isArray(valore)) {
    throw new HttpError(400, "Il campo ingredienti deve essere un array");
  }
  const lista = valore.map((v: Record<string, unknown>) => {
    const ingredienteId = Number(v?.ingredienteId);
    const quantita = Number(v?.quantita);
    const unita = typeof v?.unita === "string" ? v.unita.trim().toLowerCase() : "";
    if (!Number.isInteger(ingredienteId) || ingredienteId <= 0) {
      throw new HttpError(400, "ID ingrediente non valido");
    }
    if (!Number.isFinite(quantita) || quantita <= 0) {
      throw new HttpError(400, `Quantità non valida per l'ingrediente ${ingredienteId}`);
    }
    if (unita === "") {
      throw new HttpError(400, `Unità mancante per l'ingrediente ${ingredienteId}`);
    }
    return { ingredienteId, quantita, unita };
  });
  const ids = lista.map((i) => i.ingredienteId);
  if (new Set(ids).size !== ids.length) {
    throw new HttpError(400, "Lo stesso ingrediente compare più volte nella ricetta");
  }
  return lista;
}

// Elenco ricette con riepilogo ingredienti
router.get("/", async (_req: Request, res: Response) => {
  const [ricette] = await pool.query<RowDataPacket[]>(`
    SELECT r.*,
      COALESCE(
        GROUP_CONCAT(CONCAT(i.nome, ' (', ri.quantita, ' ', ri.unita, ')') SEPARATOR ', '),
        'Nessuno'
      ) AS ingredienti_nomi
    FROM ricette r
    LEFT JOIN ricetta_ingrediente ri ON r.id = ri.ricetta_id
    LEFT JOIN ingredienti i ON ri.ingrediente_id = i.id
    GROUP BY r.id
    ORDER BY r.nome
  `);
  res.json(ricette);
});

// Creazione: ricetta, collegamenti e scarico scorte in un'unica transazione
router.post("/", async (req: Request, res: Response) => {
  const dati = validaDatiRicetta(req.body);
  const ingredienti = validaIngredienti(req.body?.ingredienti);

  const ricettaId = await inTransazione(async (conn) => {
    // 1. Blocca le righe degli ingredienti coinvolti (SELECT ... FOR UPDATE):
    //    due richieste concorrenti non possono leggere la stessa scorta e
    //    scalarla entrambe. Il controllo avviene prima di qualsiasi scrittura.
    const scorte = new Map<number, { nome: string; quantita: number; unita: string }>();
    if (ingredienti.length > 0) {
      const ids = ingredienti.map((i) => i.ingredienteId);
      const [righe] = await conn.query<RowDataPacket[]>(
        "SELECT id, nome, quantita, unita FROM ingredienti WHERE id IN (?) ORDER BY id FOR UPDATE",
        [ids],
      );
      for (const r of righe) {
        scorte.set(r.id, { nome: r.nome, quantita: Number(r.quantita), unita: r.unita });
      }
    }

    // 2. Verifica esistenza, compatibilità delle unità e disponibilità
    const scarichi = ingredienti.map((ing) => {
      const scorta = scorte.get(ing.ingredienteId);
      if (!scorta) {
        throw new HttpError(404, `L'ingrediente con ID ${ing.ingredienteId} non esiste`);
      }
      const daScalare = convertiQuantita(ing.quantita, ing.unita, scorta.unita);
      if (daScalare > scorta.quantita) {
        throw new HttpError(
          409,
          `Scorta insufficiente di "${scorta.nome}": servono ${daScalare} ${scorta.unita}, disponibili ${scorta.quantita} ${scorta.unita}`,
        );
      }
      return { ...ing, daScalare };
    });

    // 3. Scritture
    const [ricetta] = await conn.execute<ResultSetHeader>(
      "INSERT INTO ricette (nome, istruzioni, difficolta) VALUES (?, ?, ?)",
      [dati.nome, dati.istruzioni, dati.difficolta],
    );

    for (const s of scarichi) {
      await conn.execute(
        "INSERT INTO ricetta_ingrediente (ricetta_id, ingrediente_id, quantita, unita) VALUES (?, ?, ?, ?)",
        [ricetta.insertId, s.ingredienteId, s.quantita, s.unita],
      );
      await conn.execute("UPDATE ingredienti SET quantita = quantita - ? WHERE id = ?", [
        s.daScalare,
        s.ingredienteId,
      ]);
    }

    return ricetta.insertId;
  });

  res.status(201).json({ success: true, id: ricettaId });
});

// Modifica dei dati descrittivi (nome, istruzioni, difficoltà).
// Gli ingredienti non si modificano qui: cambiarli richiederebbe di
// ricalcolare le scorte, quindi si elimina e si ricrea la ricetta.
router.put("/:id", async (req: Request, res: Response) => {
  const id = leggiId(req.params.id);
  const dati = validaDatiRicetta(req.body);
  const [risultato] = await pool.execute<ResultSetHeader>(
    "UPDATE ricette SET nome = ?, istruzioni = ?, difficolta = ? WHERE id = ?",
    [dati.nome, dati.istruzioni, dati.difficolta, id],
  );
  if (risultato.affectedRows === 0) {
    throw new HttpError(404, "Ricetta non trovata");
  }
  res.json({ success: true });
});

// Eliminazione: ripristina esattamente le quantità scalate, poi elimina
router.delete("/:id", async (req: Request, res: Response) => {
  const id = leggiId(req.params.id);

  await inTransazione(async (conn) => {
    const [ricette] = await conn.query<RowDataPacket[]>(
      "SELECT id FROM ricette WHERE id = ? FOR UPDATE",
      [id],
    );
    if (ricette.length === 0) {
      throw new HttpError(404, "Ricetta non trovata");
    }

    const [collegamenti] = await conn.query<RowDataPacket[]>(
      `SELECT ri.ingrediente_id, ri.quantita, ri.unita, i.unita AS unita_scorta
       FROM ricetta_ingrediente ri
       JOIN ingredienti i ON i.id = ri.ingrediente_id
       WHERE ri.ricetta_id = ?
       ORDER BY ri.ingrediente_id
       FOR UPDATE`,
      [id],
    );

    for (const c of collegamenti) {
      // Stessa conversione usata in creazione: il ripristino è simmetrico
      const daRipristinare = convertiQuantita(Number(c.quantita), c.unita, c.unita_scorta);
      await conn.execute("UPDATE ingredienti SET quantita = quantita + ? WHERE id = ?", [
        daRipristinare,
        c.ingrediente_id,
      ]);
    }

    // I collegamenti vengono eliminati dalla foreign key ON DELETE CASCADE
    await conn.execute("DELETE FROM ricette WHERE id = ?", [id]);
  });

  res.json({ success: true });
});

export default router;
