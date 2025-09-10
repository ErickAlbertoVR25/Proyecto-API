require('dotenv').config();

const required = ['DB_HOST','DB_USER','DB_PASS','DB_NAME'];
const missing = required.filter(k => !process.env[k]);

if (missing.length) {
  console.error('Faltan variables de entorno:', missing.join(', '));
  process.exit(1);
}

module.exports = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'production',
  DB: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    pass: process.env.DB_PASS,
    name: process.env.DB_NAME
  }
};
