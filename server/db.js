// server/db.js
// Crea y exporta un pool de conexiones mysql2/promise usando variables de entorno.
// Soporta dos fuentes de configuración:
//  - DATABASE_URL (cadena tipo mysql://user:pass@host:port/db)
//  - o las variables separadas DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME

const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * parseDatabaseUrl
 * Intenta parsear una DATABASE_URL y devolver un objeto con host, port, user, password, database.
 * Si falla el parseo devuelve null y se usará el fallback por variables separadas.
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
    return null;
  }
}

// Si la plataforma (o tú) entrega DATABASE_URL, la usamos con preferencia.
const fromUrl = process.env.DATABASE_URL ? parseDatabaseUrl(process.env.DATABASE_URL) : null;

// Configuración base: usar el parseo de URL o fallback a variables separadas
const poolConfig = fromUrl || {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'proyecto_api'
};

// Opciones adicionales para el pool (útiles en producción)
Object.assign(poolConfig, {
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Tiempo de conexión en ms para evitar bloqueos largos
  connectTimeout: 10000
});

// Crear el pool y exportarlo. El pool maneja conexiones y reintentos internos.
const pool = mysql.createPool(poolConfig);

module.exports = pool;
