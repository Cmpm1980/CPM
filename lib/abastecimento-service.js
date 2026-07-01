const { calcularStockAtual } = require('./deposito-service');

// Regista um abastecimento e a respetiva saida no deposito de forma atomica.
// Usado tanto pelo formulario online (routes/abastecimento.js) como pela
// sincronizacao de registos offline (routes/api-sync.js).
async function registarAbastecimento(client, dados) {
  const { viaturaId, litros, kmOdometro, utilizadorId, modoAcesso, origemRegisto, clienteUuid, observacoes } = dados;

  if (clienteUuid) {
    const existente = await client.execute({
      sql: 'SELECT id FROM abastecimentos WHERE cliente_uuid = ?',
      args: [clienteUuid]
    });
    if (existente.rows.length > 0) {
      return { duplicado: true, id: existente.rows[0].id };
    }
  }

  const viaturaResultado = await client.execute({
    sql: 'SELECT id, km_atual FROM viaturas WHERE id = ? AND ativo = 1',
    args: [viaturaId]
  });
  const viatura = viaturaResultado.rows[0];
  if (!viatura) {
    const erro = new Error('Viatura invalida ou inativa.');
    erro.codigo = 'viatura_invalida';
    throw erro;
  }

  const stockAtual = await calcularStockAtual(client);
  let observacoesFinal = observacoes || null;
  if (litros > stockAtual) {
    const aviso = `AVISO: stock do deposito insuficiente no momento do registo (stock=${stockAtual.toFixed(1)}L, pedido=${litros}L).`;
    observacoesFinal = observacoesFinal ? `${observacoesFinal} | ${aviso}` : aviso;
  }

  const insercao = await client.execute({
    sql: `INSERT INTO abastecimentos
            (cliente_uuid, viatura_id, litros, km_odometro, utilizador_id, modo_acesso, origem_registo, revisto_por_responsavel, observacoes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      clienteUuid || null,
      viaturaId,
      litros,
      kmOdometro,
      utilizadorId,
      modoAcesso,
      origemRegisto || 'online',
      modoAcesso === 'responsavel' && origemRegisto !== 'sincronizado_offline' ? 1 : 0,
      observacoesFinal
    ]
  });
  const abastecimentoId = Number(insercao.lastInsertRowid);

  await client.execute({
    sql: `INSERT INTO deposito_movimentos (tipo, litros, origem, abastecimento_id, criado_por)
          VALUES ('saida', ?, 'Abastecimento de viatura', ?, ?)`,
    args: [litros, abastecimentoId, utilizadorId]
  });

  if (kmOdometro > viatura.km_atual) {
    await client.execute({
      sql: "UPDATE viaturas SET km_atual = ?, atualizado_em = datetime('now') WHERE id = ?",
      args: [kmOdometro, viaturaId]
    });
  }

  return { duplicado: false, id: abastecimentoId };
}

module.exports = { registarAbastecimento };
