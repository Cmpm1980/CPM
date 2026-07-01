const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const client = require('../db/turso-client');

const router = express.Router();

router.get('/login', async (req, res) => {
  const utilizadores = await client.execute(
    "SELECT id, nome, role FROM utilizadores WHERE ativo = 1 ORDER BY (role = 'responsavel') DESC, nome"
  );
  res.render('login', { utilizadores: utilizadores.rows, erro: null });
});

router.post('/login', async (req, res) => {
  const { utilizadorId, pin } = req.body;
  const resultado = await client.execute({
    sql: 'SELECT * FROM utilizadores WHERE id = ? AND ativo = 1',
    args: [utilizadorId]
  });
  const utilizador = resultado.rows[0];

  if (!utilizador || !(await bcrypt.compare(pin || '', utilizador.pin_hash))) {
    const utilizadores = await client.execute(
      "SELECT id, nome, role FROM utilizadores WHERE ativo = 1 ORDER BY (role = 'responsavel') DESC, nome"
    );
    return res.status(401).render('login', { utilizadores: utilizadores.rows, erro: 'PIN incorreto.' });
  }

  req.session.utilizador = { id: utilizador.id, nome: utilizador.nome, role: utilizador.role };

  // Token de longa duracao para o PWA poder sincronizar abastecimentos feitos
  // offline mais tarde, mesmo que a sessao do servidor entretanto se perca.
  const deviceToken = crypto.randomBytes(24).toString('hex');
  await client.execute({
    sql: 'INSERT INTO tokens_dispositivo (token, utilizador_id) VALUES (?, ?)',
    args: [deviceToken, utilizador.id]
  });
  req.session.deviceToken = deviceToken;

  res.redirect(utilizador.role === 'responsavel' ? '/dashboard' : '/abastecer');
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;
