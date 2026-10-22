import { HttpError } from "./errori";

/**
 * Fattore di conversione verso l'unità base di ogni famiglia.
 * Unità di famiglie diverse (es. g e ml) non sono convertibili tra loro.
 */
const FATTORI: Record<string, { famiglia: string; fattore: number }> = {
  g: { famiglia: "peso", fattore: 1 },
  kg: { famiglia: "peso", fattore: 1000 },
  ml: { famiglia: "volume", fattore: 1 },
  cl: { famiglia: "volume", fattore: 10 },
  l: { famiglia: "volume", fattore: 1000 },
  pz: { famiglia: "pezzi", fattore: 1 },
  cucchiaio: { famiglia: "cucchiaio", fattore: 1 },
  cucchiaino: { famiglia: "cucchiaino", fattore: 1 },
  "q.b": { famiglia: "q.b", fattore: 1 },
};

/**
 * Converte una quantità dall'unità della ricetta all'unità in cui è tenuta
 * la scorta. Arrotonda a 2 decimali come la colonna DECIMAL(10,2), così
 * scalare e ripristinare producono sempre lo stesso valore.
 */
export function convertiQuantita(quantita: number, da: string, a: string): number {
  const sorgente = FATTORI[da];
  const destinazione = FATTORI[a];
  if (!sorgente || !destinazione || sorgente.famiglia !== destinazione.famiglia) {
    throw new HttpError(400, `Impossibile convertire da "${da}" a "${a}"`);
  }
  const convertita = (quantita * sorgente.fattore) / destinazione.fattore;
  return Math.round(convertita * 100) / 100;
}
