// Registo do Service Worker (disponibiliza a pagina /abastecer offline)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => console.error('Falha ao registar Service Worker:', err));
  });
}

// Guarda o token de dispositivo (embutido pelo servidor logo apos o login)
// em localStorage, para sobreviver a reinicios da sessao e a longos periodos offline.
if (window.DEVICE_TOKEN) {
  localStorage.setItem('deviceToken', window.DEVICE_TOKEN);
}

function getDeviceToken() {
  return localStorage.getItem('deviceToken');
}

async function enviarRegisto(registo) {
  const resposta = await fetch('/api/abastecimentos/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + getDeviceToken()
    },
    body: JSON.stringify({ registos: [registo] })
  });
  if (!resposta.ok) throw new Error('resposta_nao_ok');
  const dados = await resposta.json();
  const resultado = dados.resultados[0];
  if (!resultado.ok) throw Object.assign(new Error(resultado.erro), { permanente: true });
  return resultado;
}

async function sincronizarPendentes(atualizarEstado) {
  const pendentes = await OfflineQueue.listar();
  let sincronizados = 0;
  for (const registo of pendentes) {
    try {
      await enviarRegisto(registo);
      await OfflineQueue.remover(registo.clienteUuid);
      sincronizados++;
    } catch (err) {
      if (err.permanente) {
        await OfflineQueue.marcarErro(registo.clienteUuid, err.message);
      }
      // erro de rede (offline) - mantem pendente, tenta novamente mais tarde
    }
  }
  if (atualizarEstado) await atualizarEstado();
  return sincronizados;
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-abastecer');
  if (!form) return;

  const estadoEl = document.getElementById('estado-abastecimento');
  const pendentesEl = document.getElementById('contagem-pendentes');

  async function atualizarContagemPendentes() {
    const pendentes = await OfflineQueue.listar();
    const numPendentes = pendentes.filter(r => r.estado === 'pendente').length;
    pendentesEl.textContent = numPendentes > 0
      ? `${numPendentes} abastecimento(s) por sincronizar`
      : '';
  }

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const dadosForm = new FormData(form);
    const registo = {
      clienteUuid: crypto.randomUUID(),
      viaturaId: Number(dadosForm.get('viaturaId')),
      litros: Number(dadosForm.get('litros')),
      kmOdometro: Number(dadosForm.get('kmOdometro')),
      observacoes: dadosForm.get('observacoes') || null
    };

    try {
      await enviarRegisto(registo);
      estadoEl.textContent = 'Abastecimento registado com sucesso.';
      estadoEl.className = 'estado-ok';
    } catch (err) {
      if (err.permanente) {
        estadoEl.textContent = 'Erro ao registar: ' + err.message;
        estadoEl.className = 'estado-erro';
      } else {
        await OfflineQueue.adicionar(registo);
        estadoEl.textContent = 'Sem rede - guardado neste telemovel. Vai sincronizar automaticamente quando houver internet.';
        estadoEl.className = 'estado-offline';
      }
    }
    form.reset();
    await atualizarContagemPendentes();
  });

  atualizarContagemPendentes();
  sincronizarPendentes(atualizarContagemPendentes);
  window.addEventListener('online', () => sincronizarPendentes(atualizarContagemPendentes));
  setInterval(() => sincronizarPendentes(atualizarContagemPendentes), 2 * 60 * 1000);
});
