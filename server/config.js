// server/config.js
// Carga variables de entorno y valida que las mínimas para conectar la BD existan.
// Este archivo centraliza la configuración que el servidor puede necesitar.

require('dotenv').config();

// Variables obligatorias para la conexión a la base de datos.
// Si alguna falta, salimos con código de error para evitar arrancar el servidor en estado inconsistente.
const required = ['DB_HOST','DB_USER','DB_PASS','DB_NAME'];
const missing = required.filter(k => !process.env[k]);

if (missing.length) {
  console.error('Faltan variables de entorno:', missing.join(', '));
  // Terminamos el proceso con error: es mejor fallar rápido que intentar arrancar sin configuración.
  process.exit(1);
}

// Exporta un objeto de configuración que otros módulos pueden requerir.
// Nota: No imprimas aquí valores sensibles en logs en producción.
module.exports = {
  // Puerto HTTP donde escuchará el servidor. En plataformas PaaS (Railway, Heroku...)
  // lo habitual es dejar que la plataforma asigne process.env.PORT; se proporciona 3000 por defecto en dev.
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'production',

  // Grupo de configuración de la BD
  DB: {
    host: process.env.DB_HOST,
    // DB_PORT es opcional; mysql2 usará 3306 si no se especifica
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    user: process.env.DB_USER,
    pass: process.env.DB_PASS,
    name: process.env.DB_NAME
  }
};
