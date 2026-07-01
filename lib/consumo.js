// Recebe abastecimentos de uma viatura ordenados por km_odometro ascendente
// e devolve o consumo (L/100km) entre cada par de abastecimentos consecutivos.
function calcularConsumos(abastecimentos) {
  const consumos = [];
  for (let i = 1; i < abastecimentos.length; i++) {
    const anterior = abastecimentos[i - 1];
    const atual = abastecimentos[i];
    const distancia = atual.km_odometro - anterior.km_odometro;
    if (distancia <= 0) continue; // km invalido/nao crescente, ignora este par
    const l100km = (atual.litros / distancia) * 100;
    consumos.push({ abastecimentoId: atual.id, l100km, distancia });
  }
  return consumos;
}

// Sinaliza o abastecimento mais recente se o seu consumo exceder 130% da
// media historica da propria viatura (limiar simples, sem ML).
function detectarAnomalia(abastecimentos, limiar = 1.3) {
  const consumos = calcularConsumos(abastecimentos);
  if (consumos.length < 2) return null; // sem historico suficiente para comparar
  const ultimo = consumos[consumos.length - 1];
  const anteriores = consumos.slice(0, -1);
  const media = anteriores.reduce((soma, c) => soma + c.l100km, 0) / anteriores.length;
  if (ultimo.l100km > media * limiar) {
    return { abastecimentoId: ultimo.abastecimentoId, l100km: ultimo.l100km, mediaHistorica: media };
  }
  return null;
}

module.exports = { calcularConsumos, detectarAnomalia };
