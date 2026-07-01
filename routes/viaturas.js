const express = require('express');
const client = require('../db/turso-client');
const { requireResponsavel } = require('../lib/auth-middleware');
const { calcularConsumos } = require('../lib/consumo');

const router = express.Router();

router.get('/viaturas', requireResponsavel, async (req, res) => {
  const viaturas = await client.execute('SELECT * FROM viaturas ORDER BY ativo DESC, matricula');
  res.render('viaturas-lista', { utilizador: req.session.utilizador, viaturas: viaturas.rows });
});

router.get('/viaturas/novo', requireResponsavel, async (req, res) => {
  res.render('viatura-form', { utilizador: req.session.utilizador, viatura: null, erro: null });
});

router.post('/viaturas', requireResponsavel, async (req, res) => {
  const { matricula, marca, modelo, capacidadeDepositoLitros, kmAtual, departamento, observacoes } = req.body;
  try {
    await client.execute({
      sql: `INSERT INTO viaturas (matricula, marca, modelo, capacidade_deposito_litros, km_atual, departamento, observacoes)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [matricula.toUpperCase(), marca || null, modelo || null, capacidadeDepositoLitros || null, kmAtual || 0, departamento || null, observacoes || null]
    });
    res.redirect('/viaturas');
  } catch (err) {
    res.status(400).render('viatura-form', { utilizador: req.session.utilizador, viatura: req.body, erro: 'Nao foi possivel guardar (matricula em duplicado?)' });
  }
});

router.get('/viaturas/:id/editar', requireResponsavel, async (req, res) => {
  const resultado = await client.execute({ sql: 'SELECT * FROM viaturas WHERE id = ?', args: [req.params.id] });
  if (!resultado.rows[0]) return res.status(404).render('erro', { mensagem: 'Viatura nao encontrada.' });
  res.render('viatura-form', { utilizador: req.session.utilizador, viatura: resultado.rows[0], erro: null });
});

router.post('/viaturas/:id', requireResponsavel, async (req, res) => {
  const { matricula, marca, modelo, capacidadeDepositoLitros, kmAtual, departamento, observacoes } = req.body;
  await client.execute({
    sql: `UPDATE viaturas SET matricula = ?, marca = ?, modelo = ?, capacidade_deposito_litros = ?, km_atual = ?, departamento = ?, observacoes = ?, atualizado_em = datetime('now')
          WHERE id = ?`,
    args: [matricula.toUpperCase(), marca || null, modelo || null, capacidadeDepositoLitros || null, kmAtual || 0, departamento || null, observacoes || null, req.params.id]
  });
  res.redirect('/viaturas');
});

router.post('/viaturas/:id/inativar', requireResponsavel, async (req, res) => {
  await client.execute({ sql: "UPDATE viaturas SET ativo = 0, atualizado_em = datetime('now') WHERE id = ?", args: [req.params.id] });
  res.redirect('/viaturas');
});

router.post('/viaturas/:id/ativar', requireResponsavel, async (req, res) => {
  await client.execute({ sql: "UPDATE viaturas SET ativo = 1, atualizado_em = datetime('now') WHERE id = ?", args: [req.params.id] });
  res.redirect('/viaturas');
});

router.get('/viaturas/:id/historico', requireResponsavel, async (req, res) => {
  const viaturaResultado = await client.execute({ sql: 'SELECT * FROM viaturas WHERE id = ?', args: [req.params.id] });
  const viatura = viaturaResultado.rows[0];
  if (!viatura) return res.status(404).render('erro', { mensagem: 'Viatura nao encontrada.' });

  const abastecimentosResultado = await client.execute({
    sql: `SELECT a.*, u.nome AS utilizador_nome FROM abastecimentos a
          JOIN utilizadores u ON u.id = a.utilizador_id
          WHERE a.viatura_id = ? AND a.anulado = 0
          ORDER BY a.km_odometro ASC`,
    args: [req.params.id]
  });

  const consumos = calcularConsumos(abastecimentosResultado.rows);
  const consumoPorId = Object.fromEntries(consumos.map(c => [c.abastecimentoId, c.l100km]));

  res.render('viatura-historico', {
    utilizador: req.session.utilizador,
    viatura,
    abastecimentos: [...abastecimentosResultado.rows].reverse(),
    consumoPorId
  });
});

module.exports = router;
