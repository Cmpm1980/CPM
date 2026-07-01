const express = require('express');
const client = require('../db/turso-client');
const { requireResponsavel } = require('../lib/auth-middleware');
const { calcularStockAtual } = require('../lib/deposito-service');

const router = express.Router();

router.get('/deposito', requireResponsavel, async (req, res) => {
  const stock = await calcularStockAtual(client);
  const movimentos = await client.execute(`
    SELECT m.*, u.nome AS criado_por_nome FROM deposito_movimentos m
    JOIN utilizadores u ON u.id = m.criado_por
    ORDER BY m.data_hora DESC LIMIT 100
  `);
  res.render('deposito', {
    utilizador: req.session.utilizador,
    stock,
    capacidadeTotal: 3000,
    movimentos: movimentos.rows
  });
});

router.post('/deposito/entrega', requireResponsavel, async (req, res) => {
  const { litros, origem, faturaReferencia } = req.body;
  await client.execute({
    sql: `INSERT INTO deposito_movimentos (tipo, litros, origem, fatura_referencia, criado_por)
          VALUES ('entrada', ?, ?, ?, ?)`,
    args: [Number(litros), origem || null, faturaReferencia || null, req.session.utilizador.id]
  });
  res.redirect('/deposito');
});

router.post('/deposito/ajuste', requireResponsavel, async (req, res) => {
  const { litros, observacoes } = req.body;
  await client.execute({
    sql: `INSERT INTO deposito_movimentos (tipo, litros, origem, observacoes, criado_por)
          VALUES ('ajuste', ?, 'Reconciliacao fisica', ?, ?)`,
    args: [Number(litros), observacoes || null, req.session.utilizador.id]
  });
  res.redirect('/deposito');
});

module.exports = router;
