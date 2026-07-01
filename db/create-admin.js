// Uso: node db/create-admin.js "Nome Completo" 1234
// Cria (ou recria) o utilizador inicial com role 'responsavel'. Necessario
// correr uma vez antes do primeiro login, porque nao ha ecra de registo.
const bcrypt = require('bcryptjs');
const client = require('./turso-client');

async function criarAdmin() {
  const nome = process.argv[2];
  const pin = process.argv[3];

  if (!nome || !/^\d{4}$/.test(pin || '')) {
    console.error('Uso: node db/create-admin.js "Nome Completo" 1234  (PIN deve ter exatamente 4 digitos)');
    process.exit(1);
  }

  const pinHash = await bcrypt.hash(pin, 10);
  await client.execute({
    sql: "INSERT INTO utilizadores (nome, role, pin_hash, ativo) VALUES (?, 'responsavel', ?, 1)",
    args: [nome, pinHash]
  });

  console.log(`Utilizador responsavel "${nome}" criado com sucesso.`);
}

criarAdmin()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Erro ao criar utilizador responsavel:', err);
    process.exit(1);
  });
