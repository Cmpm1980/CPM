async function calcularStockAtual(client) {
  const resultado = await client.execute(`
    SELECT
      COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN litros WHEN tipo = 'ajuste' THEN litros ELSE 0 END), 0)
      - COALESCE(SUM(CASE WHEN tipo = 'saida' THEN litros ELSE 0 END), 0) AS stock
    FROM deposito_movimentos
  `);
  return resultado.rows[0].stock;
}

module.exports = { calcularStockAtual };
