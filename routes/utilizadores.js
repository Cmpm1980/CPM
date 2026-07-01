const express = require('express');
const bcrypt = require('bcryptjs');
const client = require('../db/turso-client');
const { requireResponsavel } = require('../lib/auth-middleware');

const router = express.Router();

router.get('/utilizadores', requireResponsavel, async (req, res) => {
  const utilizadores = await client.execute("SELECT id, nome, role, ativo FROM utilizadores ORDER BY ativo DESC, role, nome");
  res.render('utilizadores', { utilizador: req.session.utilizador, utilizadores: utilizadores.rows, erro: null });
});

router.post('/utilizadores', requireResponsavel, async (req, res) => {
  const { nome, role, pin } = req.body;
  if (!/^\d{4}$/.test(pin || '')) {
    const utilizadores = await client.execute("SELECT id, nome, role, ativo FROM utilizadores ORDER BY ativo DESC, role, nome");
    return res.status(400).render('utilizadores', { utilizador: req.session.utilizador, utilizadores: utilizadores.rows, erro: 'PIN deve ter exatamente 4 digitos.' });
  }
  const pinHash = await bcrypt.hash(pin, 10);
  await client.execute({
    sql: 'INSERT INTO utilizadores (nome, role, pin_hash, ativo) VALUES (?, ?, ?, 1)',
    args: [nome, role === 'responsavel' ? 'responsavel' : 'motorista', pinHash]
  });
  res.redirect('/utilizadores');
});

router.post('/utilizadores/:id/reset-pin', requireResponsavel, async (req, res) => {
  const { pin } = req.body;
  if (!/^\d{4}$/.test(pin || '')) return res.redirect('/utilizadores');
  const pinHash = await bcrypt.hash(pin, 10);
  await client.execute({ sql: 'UPDATE utilizadores SET pin_hash = ? WHERE id = ?', args: [pinHash, req.params.id] });
  res.redirect('/utilizadores');
});

router.post('/utilizadores/:id/inativar', requireResponsavel, async (req, res) => {
  await client.execute({ sql: 'UPDATE utilizadores SET ativo = 0 WHERE id = ?', args: [req.params.id] });
  res.redirect('/utilizadores');
});

router.post('/utilizadores/:id/ativar', requireResponsavel, async (req, res) => {
  await client.execute({ sql: 'UPDATE utilizadores SET ativo = 1 WHERE id = ?', args: [req.params.id] });
  res.redirect('/utilizadores');
});

module.exports = router;
