const client = require('../db/turso-client');

// Autentica pedidos do PWA (fetch de sincronizacao) usando o token de
// dispositivo em vez da sessao cookie, para funcionar mesmo que a sessao
// do servidor tenha expirado entretanto (ex: reinicio do servico cloud
// enquanto o telemovel esteve offline).
async function requireDeviceToken(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ erro: 'token_em_falta' });

  const resultado = await client.execute({
    sql: `SELECT u.id, u.nome, u.role FROM tokens_dispositivo t
          JOIN utilizadores u ON u.id = t.utilizador_id
          WHERE t.token = ? AND t.revogado = 0 AND u.ativo = 1`,
    args: [token]
  });
  const utilizador = resultado.rows[0];
  if (!utilizador) return res.status(401).json({ erro: 'token_invalido' });

  req.utilizadorToken = utilizador;
  next();
}

module.exports = { requireDeviceToken };
