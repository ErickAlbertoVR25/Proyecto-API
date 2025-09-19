// server/routes/usuarios.js
// Rutas CRUD para usuarios. Validaciones con express-validator.
// Usa consultas parametrizadas (?) para prevenir SQL injection.

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const pool = require('../db');

const router = express.Router();

/**
 * handleValidation
 * Envía 400 con un array de errores si express-validator detectó problemas.
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
 * Lista todos los usuarios (sin campos sensibles).
 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre, apellido, correo, fecha_creacion FROM usuarios ORDER BY id DESC'
    );
    return res.json(rows);
  } catch (err) {
    console.error('GET /usuarios error:', err);
    return res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

/**
 * GET /usuarios/:id
 * Devuelve un usuario por id o 404 si no existe.
 */
router.get('/:id', [
  param('id').isInt({ gt: 0 }).withMessage('id debe ser entero positivo'),
  handleValidation
], async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre, apellido, correo, fecha_creacion FROM usuarios WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.json(rows[0]);
  } catch (err) {
    console.error(`GET /usuarios/${id} error:`, err);
    return res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

/**
 * POST /usuarios
 * Crea un nuevo usuario. Si el correo ya existe devuelve 409.
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
    // Devuelve 201 Created con el id del nuevo recurso
    return res.status(201).json({ id: result.insertId, nombre, apellido, correo });
  } catch (err) {
    console.error('POST /usuarios error:', err);
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }
    return res.status(500).json({ error: 'Error al crear usuario' });
  }
});

/**
 * PUT /usuarios/:id
 * Actualización parcial del usuario. Devuelve 404 si el id no existe.
 */
router.put('/:id', [
  param('id').isInt({ gt: 0 }).withMessage('id inválido'),
  body('nombre').optional().isString().trim().isLength({ min: 2 }),
  body('apellido').optional().isString().trim().isLength({ min: 2 }),
  body('correo').optional().isEmail().normalizeEmail(),
  handleValidation
], async (req, res) => {
  const id = Number(req.params.id);
  const { nombre, apellido, correo } = req.body;

  // Construcción dinámica de campos a actualizar (solo los proporcionados)
  const fields = [];
  const values = [];
  if (nombre !== undefined) { fields.push('nombre = ?'); values.push(nombre); }
  if (apellido !== undefined) { fields.push('apellido = ?'); values.push(apellido); }
  if (correo !== undefined) { fields.push('correo = ?'); values.push(correo); }

  if (fields.length === 0) return res.status(400).json({ error: 'No hay campos para actualizar' });

  values.push(id);
  const sql = `UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`;

  try {
    const [result] = await pool.query(sql, values);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.json({ ok: true, id });
  } catch (err) {
    console.error(`PUT /usuarios/${id} error:`, err);
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }
    return res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

/**
 * DELETE /usuarios/:id
 * Elimina el usuario y devuelve ok o 404 si no existe.
 */
router.delete('/:id', [
  param('id').isInt({ gt: 0 }).withMessage('id inválido'),
  handleValidation
], async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [result] = await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.json({ ok: true });
  } catch (err) {
    console.error(`DELETE /usuarios/${id} error:`, err);
    return res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

module.exports = router;
