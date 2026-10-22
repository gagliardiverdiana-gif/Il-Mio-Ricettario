import mysql, { PoolConnection } from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "Ricettario_cucina",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // DECIMAL restituiti come numeri invece che come stringhe
  decimalNumbers: true,
});

/**
 * Esegue una funzione dentro una transazione su una connessione dedicata.
 * COMMIT se tutto va a buon fine, ROLLBACK su qualsiasi errore, e la
 * connessione torna sempre al pool grazie al finally.
 */
export async function inTransazione<T>(lavoro: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const risultato = await lavoro(conn);
    await conn.commit();
    return risultato;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export default pool;
