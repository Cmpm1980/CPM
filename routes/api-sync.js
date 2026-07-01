const express = require('express');
const client = require('../db/turso-client');
const { requireDeviceToken } = require('../lib/device-token-middleware');
const { registarAbastecimento } = require('../lib/abastecimento-service');

const router = express.Router();

// Recebe um lote de abastecimentos (1 registo feito online em tempo real,
// ou varios acumulados offline no telemovel) e regista cada um, deduplicando
// por cliente_uuid para o caso de o telemovel reenviar o mesmo registo.
router.post('/api/abastecimentos/sync', requireDeviceToken, async (req, res) => {
  const registos = Array.isArray(req.body.registos) ? req.body.registos : [];
  if (registos.length === 0) {
    return res.status(400).json({ erro: 'sem_registos' });
  }

  const resultados = [];
  for (const registo of registos) {
    const { clienteUuid, viaturaId, litros, kmOdometro, origemRegisto, observacoes } = registo;

    if (!viaturaId || !litros || litros <= 0 || !kmOdometro || kmOdometro <= 0) {
      resultados.push({ clienteUuid, ok: false, erro: 'dados_invalidos' });
      continue;
    }

    try {
      const resultado = await registarAbastecimento(client, {
        viaturaId,
        litros,
        kmOdometro,
        utilizadorId: req.utilizadorToken.id,
        modoAcesso: req.utilizadorToken.role,
        origemRegisto: origemRegisto || 'online',
        clienteUuid,
        observacoes
      });
      resultados.push({ clienteUuid, ok: true, id: resultado.id, duplicado: resultado.duplicado });
    } catch (err) {
      resultados.push({ clienteUuid, ok: false, erro: err.codigo || 'erro_desconhecido' });
    }
  }

  res.json({ resultados });
});

module.exports = router;
