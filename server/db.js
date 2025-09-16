// server/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Construye la configuración de conexión a partir de:
 * 1) DATABASE_URL (si existe) -> mysql://user:pass@host:port/db
 * 2) variables separadas: DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME
 *
 * NOTA: Evita imprimir en logs credenciales en producción.
 */
function parseDatabaseUrl(dbUrl) {
  try {
    const url = new URL(dbUrl);
    return {
      host: url.hostname,
      port: url.port ? Number(url.port) : 3306,
      user: url.username,
      password: url.password,
      database: url.pathname ? url.pathname.replace(/^\//, '') : undefined
    };
  } catch (err) {
    // si falla el parseo, devolvemos null para que se use el fallback
    return null;
  }
}

const fromUrl = process.env.DATABASE_URL ? parseDatabaseUrl(process.env.DATABASE_URL) : null;

const poolConfig = fromUrl || {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'proyecto_api'
};

// Opciones adicionales útiles para producción/desarrollo
Object.assign(poolConfig, {
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // tiempo máximo para conectar en ms (evita que la app se quede colgada demasiado)
  connectTimeout: 10000
});

const pool = mysql.createPool(poolConfig);

module.exports = pool;
