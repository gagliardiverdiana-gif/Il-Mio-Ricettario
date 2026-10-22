import { Request, Response, NextFunction } from "express";

/**
 * Errore applicativo con codice HTTP associato.
 * Il messaggio viene mostrato al client: deve essere comprensibile e non
 * contenere dettagli interni (query, stack trace, nomi di tabelle).
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/** Converte un parametro di rotta in un ID intero positivo, altrimenti 400. */
export function leggiId(valore: string | string[] | undefined): number {
  const id = Number(valore);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, "ID non valido");
  }
  return id;
}

/**
 * Middleware centrale degli errori.
 * Express 5 inoltra qui automaticamente gli errori lanciati dalle rotte async,
 * quindi le rotte non devono ripetere try/catch solo per rispondere 500.
 */
export function gestoreErrori(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ errore: err.message });
  }
  console.error("Errore non gestito:", err);
  res.status(500).json({ errore: "Errore interno del server" });
}
