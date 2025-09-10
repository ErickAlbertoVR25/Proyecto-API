// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const usuariosRouter = require('./routes/usuarios');
const productosRouter = require('./routes/productos');

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
app.use('/usuarios', usuariosRouter);
app.use('/productos', productosRouter);

app.get('/', (req, res) => res.json({ ok: true, msg: 'API en ejecución' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
