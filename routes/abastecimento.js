const express = require('express');
const client = require('../db/turso-client');
const { requireLogin } = require('../lib/auth-middleware');

const router = express.Router();

router.get('/abastecer', requireLogin, async (req, res) => {
  const viaturas = await client.execute(
    'SELECT id, matricula, marca, modelo, km_atual FROM viaturas WHERE ativo = 1 ORDER BY matricula'
  );

  res.render('abastecer', {
    utilizador: req.session.utilizador,
    viaturas: viaturas.rows,
    // So enviado logo apos o login (guardado na sessao); a pagina em cache
    // do Service Worker mantem o ultimo token embutido para uso offline.
    deviceToken: req.session.deviceToken || null
  });
  // Token so precisa de ser usado uma vez para o cliente o guardar em localStorage.
  delete req.session.deviceToken;
});

module.exports = router;
