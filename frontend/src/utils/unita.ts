/**
 * Unità di misura gestite dall'app, raggruppate per famiglia.
 * Rispecchia backend/src/unita.ts: due unità sono convertibili
 * solo se appartengono alla stessa famiglia.
 */
const FAMIGLIE: Record<string, string> = {
  g: "peso",
  kg: "peso",
  ml: "volume",
  cl: "volume",
  l: "volume",
  pz: "pezzi",
  cucchiaio: "cucchiaio",
  cucchiaino: "cucchiaino",
  "q.b": "q.b",
};

/** Elenco completo, nell'ordine in cui compare nei menu a tendina. */
export const UNITA = Object.keys(FAMIGLIE);

/** Unità in cui si può esprimere una quantità di un ingrediente tenuto in `unitaScorta`. */
export function unitaCompatibili(unitaScorta: string): string[] {
  const famiglia = FAMIGLIE[unitaScorta];
  return UNITA.filter((u) => FAMIGLIE[u] === famiglia);
}
