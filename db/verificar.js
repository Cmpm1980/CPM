const client = require('./turso-client');

async function verificar() {
  const utilizadores = await client.execute('SELECT id, nome, role FROM utilizadores');
  const viaturas = await client.execute('SELECT id, matricula, marca FROM viaturas');
  console.log('Utilizadores:', JSON.stringify(utilizadores.rows));
  console.log('Viaturas:', JSON.stringify(viaturas.rows));
}

verificar().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
