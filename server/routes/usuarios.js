// server/routes/usuarios.js
const express = require('express');
const { body, param, validationResult } = require('express-validator');
const pool = require('../db');

const router = express.Router();

/**
 * Helper: maneja errores de express-validator
 */
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

/**
 * GET /usuarios
 * Obtiene todos los usuarios (sin campos sensibles)
 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre, apellido, correo, fecha_creacion FROM usuarios ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    console.error('GET /usuarios error:', err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

/**
 * GET /usuarios/:id
 */
router.get('/:id', [
  param('id').isInt({ gt: 0 }).withMessage('id debe ser entero positivo'),
  handleValidation
], async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre, apellido, correo, fecha_creacion FROM usuarios WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /usuarios/:id error:', err);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

/**
 * POST /usuarios
 * Crea un nuevo usuario
 */
router.post('/', [
  body('nombre').isString().trim().isLength({ min: 2 }).withMessage('nombre inválido'),
  body('apellido').isString().trim().isLength({ min: 2 }).withMessage('apellido inválido'),
  body('correo').isEmail().withMessage('correo inválido').normalizeEmail(),
  handleValidation
], async (req, res) => {
  const { nombre, apellido, correo } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, apellido, correo) VALUES (?, ?, ?)',
      [nombre, apellido, correo]
    );
    res.status(201).json({ id: result.insertId, nombre, apellido, correo });
  } catch (err) {
    console.error('POST /usuarios error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

/**
 * PUT /usuarios/:id
 * Actualiza un usuario (requiere todos o algunos campos)
 */
router.put('/:id', [
  param('id').isInt({ gt: 0 }).withMessage('id inválido'),
  body('nombre').optional().isString().trim().isLength({ min: 2 }),
  body('apellido').optional().isString().trim().isLength({ min: 2 }),
  body('correo').optional().isEmail().normalizeEmail(),
  handleValidation
], async (req, res) => {
  const { nombre, apellido, correo } = req.body;
  const id = req.params.id;

  // Construir consulta dinámica simple
  const fields = [];
  const values = [];
  if (nombre) { fields.push('nombre = ?'); values.push(nombre); }
  if (apellido) { fields.push('apellido = ?'); values.push(apellido); }
  if (correo) { fields.push('correo = ?'); values.push(correo); }

  if (fields.length === 0) return res.status(400).json({ error: 'No hay campos para actualizar' });

  values.push(id);
  const sql = `UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`;

  try {
    const [result] = await pool.query(sql, values);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ ok: true, id: Number(id) });
  } catch (err) {
    console.error('PUT /usuarios/:id error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

/**
 * DELETE /usuarios/:id
 */
router.delete('/:id', [
  param('id').isInt({ gt: 0 }).withMessage('id inválido'),
  handleValidation
], async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /usuarios/:id error:', err);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

module.exports = router;
