// server/routes/productos.js
// Rutas RESTful para manejar productos (CRUD).
// Usa express-validator para validar inputs y mysql2/promise a través de `pool`.

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const pool = require('../db');

const router = express.Router();

/**
 * handleValidation
 * Helper que revisa el resultado de express-validator y responde 400 con el detalle si hay errores.
 */
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
}

/* GET /productos
   Devuelve la lista de productos (sin información sensible).
*/
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre, descripcion, precio, fecha_creacion FROM productos ORDER BY id DESC');
    return res.json(rows);
  } catch (err) {
    console.error('GET /productos error:', err);
    return res.status(500).json({ error: 'Error al obtener productos' });
  }
});

/* GET /productos/:id
   Devuelve un producto por su id, o 404 si no existe.
*/
router.get('/:id', [
  param('id').isInt({ gt: 0 }).withMessage('id inválido'),
  handleValidation
], async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre, descripcion, precio, fecha_creacion FROM productos WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    return res.json(rows[0]);
  } catch (err) {
    console.error(`GET /productos/${id} error:`, err);
    return res.status(500).json({ error: 'Error al obtener producto' });
  }
});

/* POST /productos
   Crea un nuevo producto. Validaciones:
   - nombre: mínimo 2 caracteres
   - descripcion: opcional
   - precio: opcional, si viene debe ser float >= 0
*/
router.post('/', [
  body('nombre').isString().trim().isLength({ min: 2 }).withMessage('nombre inválido'),
  body('descripcion').optional().isString().trim(),
  body('precio').optional().isFloat({ min: 0 }).withMessage('precio inválido'),
  handleValidation
], async (req, res) => {
  const { nombre, descripcion = null, precio = 0.0 } = req.body;

  try {
    const [result] = await pool.query(
      'INSERT INTO productos (nombre, descripcion, precio) VALUES (?, ?, ?)',
      [nombre, descripcion, precio]
    );
    // Devolvemos 201 Created con el id del recurso.
    return res.status(201).json({ id: result.insertId, nombre, descripcion, precio });
  } catch (err) {
    console.error('POST /productos error:', err);
    return res.status(500).json({ error: 'Error al crear producto' });
  }
});

/* PUT /productos/:id
   Actualización parcial de producto: acepta uno o varios campos.
   Respuestas: 400 si no hay campos, 404 si id no existe, 200 si ok.
*/
router.put('/:id', [
  param('id').isInt({ gt: 0 }).withMessage('id inválido'),
  body('nombre').optional().isString().trim().isLength({ min: 2 }),
  body('descripcion').optional().isString().trim(),
  body('precio').optional().isFloat({ min: 0 }),
  handleValidation
], async (req, res) => {
  const id = Number(req.params.id);
  const { nombre, descripcion, precio } = req.body;

  // Construimos consulta dinámica solo con los campos presentes
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
    return res.json({ ok: true, id });
  } catch (err) {
    console.error(`PUT /productos/${id} error:`, err);
    return res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

/* DELETE /productos/:id
   Borra el producto indicado por id.
*/
router.delete('/:id', [
  param('id').isInt({ gt: 0 }).withMessage('id inválido'),
  handleValidation
], async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [result] = await pool.query('DELETE FROM productos WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    return res.json({ ok: true });
  } catch (err) {
    console.error(`DELETE /productos/${id} error:`, err);
    return res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

module.exports = router;
