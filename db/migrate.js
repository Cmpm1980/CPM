const fs = require('fs');
const path = require('path');
const client = require('./turso-client');

async function migrate() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await client.executeMultiple(schema);
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
  console.log('Tabelas criadas/confirmadas:', tables.rows.map(r => r.name).join(', '));
}

migrate()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Erro ao migrar a base de dados:', err);
    process.exit(1);
  });
