import axios from "axios";

/**
 * Estrae un messaggio leggibile da un errore di una chiamata API.
 * Il backend risponde sempre con { errore: "..." }; se il server non
 * risponde affatto, lo diciamo in modo chiaro.
 */
export function messaggioErrore(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const dati = err.response?.data as { errore?: string } | undefined;
    if (dati?.errore) return dati.errore;
    if (!err.response) return "Il server non risponde. Il backend è acceso?";
  }
  return "Si è verificato un errore imprevisto";
}
