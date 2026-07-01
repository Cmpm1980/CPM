// Fila offline de abastecimentos, guardada em IndexedDB no telemovel.
// Sem dependencias externas - API nativa do browser envolvida em Promises.
const OfflineQueue = (function () {
  const DB_NAME = 'frota-offline';
  const STORE = 'abastecimentos_pendentes';
  let dbPromise = null;

  function abrirDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const pedido = indexedDB.open(DB_NAME, 1);
      pedido.onupgradeneeded = () => {
        const db = pedido.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'clienteUuid' });
        }
      };
      pedido.onsuccess = () => resolve(pedido.result);
      pedido.onerror = () => reject(pedido.error);
    });
    return dbPromise;
  }

  async function adicionar(registo) {
    const db = await abrirDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({ ...registo, estado: 'pendente' });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function listar() {
    const db = await abrirDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const pedido = tx.objectStore(STORE).getAll();
      pedido.onsuccess = () => resolve(pedido.result);
      pedido.onerror = () => reject(pedido.error);
    });
  }

  async function remover(clienteUuid) {
    const db = await abrirDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(clienteUuid);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function marcarErro(clienteUuid, motivo) {
    const db = await abrirDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const pedido = store.get(clienteUuid);
      pedido.onsuccess = () => {
        const registo = pedido.result;
        if (registo) {
          registo.estado = 'erro';
          registo.erro = motivo;
          store.put(registo);
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  return { adicionar, listar, remover, marcarErro };
})();
