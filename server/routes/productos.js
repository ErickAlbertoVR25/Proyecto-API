// server/routes/productos.js
const express = require('express');
const { body, param, validationResult } = require('express-validator');
const pool = require('../db');

const router = express.Router();

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
}

/* GET /productos */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre, descripcion, precio, fecha_creacion FROM productos ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    console.error('GET /productos error:', err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

/* GET /productos/:id */
router.get('/:id', [
  param('id').isInt({ gt: 0 }).withMessage('id inválido'),
  handleValidation
], async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre, descripcion, precio, fecha_creacion FROM productos WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /productos/:id error:', err);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

/* POST /productos */
router.post('/', [
  body('nombre').isString().trim().isLength({ min: 2 }).withMessage('nombre inválido'),
  body('descripcion').optional().isString().trim(),
  body('precio').optional().isFloat({ min: 0 }).withMessage('precio inválido'),
  handleValidation
], async (req, res) => {
  const { nombre, descripcion = null, precio = 0.0 } = req.body;
  try {
    const [result] = await pool.query('INSERT INTO productos (nombre, descripcion, precio) VALUES (?, ?, ?)', [nombre, descripcion, precio]);
    res.status(201).json({ id: result.insertId, nombre, descripcion, precio });
  } catch (err) {
    console.error('POST /productos error:', err);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

/* PUT /productos/:id */
router.put('/:id', [
  param('id').isInt({ gt: 0 }),
  body('nombre').optional().isString().trim().isLength({ min: 2 }),
  body('descripcion').optional().isString().trim(),
  body('precio').optional().isFloat({ min: 0 }),
  handleValidation
], async (req, res) => {
  const id = req.params.id;
  const { nombre, descripcion, precio } = req.body;

  const fields = [];
  const values = [];
  if (nombre !== undefined) { fields.push('nombre = ?'); values.push(nombre); }
  if (descripcion !== undefined) { fields.push('descripcion = ?'); values.push(descripcion); }
  if (precio !== undefined) { fields.push('precio = ?'); values.push(precio); }

  if (fields.length === 0) return res.status(400).json({ error: 'No hay campos para actualizar' });

  values.push(id);
  const sql = `UPDATE productos SET ${fields.join(', ')} WHERE id = ?`;

  try {
    const [result] = await pool.query(sql, values);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ ok: true, id: Number(id) });
  } catch (err) {
    console.error('PUT /productos/:id error:', err);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

/* DELETE /productos/:id */
router.delete('/:id', [
  param('id').isInt({ gt: 0 }).withMessage('id inválido'),
  handleValidation
], async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM productos WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /productos/:id error:', err);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

module.exports = router;
