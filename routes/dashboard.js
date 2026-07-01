const express = require('express');
const client = require('../db/turso-client');
const { requireResponsavel } = require('../lib/auth-middleware');
const { calcularStockAtual } = require('../lib/deposito-service');
const { detectarAnomalia } = require('../lib/consumo');

const router = express.Router();

router.get('/dashboard', requireResponsavel, async (req, res) => {
  const stock = await calcularStockAtual(client);

  const pendentesResultado = await client.execute(`
    SELECT a.*, v.matricula, u.nome AS utilizador_nome FROM abastecimentos a
    JOIN viaturas v ON v.id = a.viatura_id
    JOIN utilizadores u ON u.id = a.utilizador_id
    WHERE a.revisto_por_responsavel = 0 AND a.anulado = 0
    ORDER BY a.data_hora DESC
  `);

  const viaturas = await client.execute('SELECT id, matricula FROM viaturas WHERE ativo = 1');
  const alertas = [];
  for (const viatura of viaturas.rows) {
    const abastecimentosResultado = await client.execute({
      sql: `SELECT id, litros, km_odometro FROM abastecimentos
            WHERE viatura_id = ? AND anulado = 0 ORDER BY km_odometro ASC`,
      args: [viatura.id]
    });
    const anomalia = detectarAnomalia(abastecimentosResultado.rows);
    if (anomalia) {
      alertas.push({ matricula: viatura.matricula, ...anomalia });
    }
  }

  res.render('dashboard', {
    utilizador: req.session.utilizador,
    stock,
    capacidadeTotal: 3000,
    pendentes: pendentesResultado.rows,
    alertas
  });
});

router.post('/pendentes/:id/rever', requireResponsavel, async (req, res) => {
  await client.execute({
    sql: "UPDATE abastecimentos SET revisto_por_responsavel = 1, revisto_em = datetime('now') WHERE id = ?",
    args: [req.params.id]
  });
  res.redirect('/dashboard');
});

router.post('/abastecimentos/:id/anular', requireResponsavel, async (req, res) => {
  await client.execute({ sql: 'UPDATE abastecimentos SET anulado = 1 WHERE id = ?', args: [req.params.id] });
  res.redirect('/dashboard');
});

module.exports = router;
