const fs = require('fs');
const path = require('path');
const client = require('./turso-client');

const INDEX_PATH = path.join(__dirname, '..', '..', 'Doc_Viaturas', 'Index-viaturas.md');

function parseLinha(linha) {
  const matriculaMatch = linha.match(/\d{2}[-\s][A-Z]{2}[-\s]\d{2}|\d{2}[-\s]\d{2}[-\s][A-Z]{2}/i);
  if (!matriculaMatch) return null;
  const matricula = matriculaMatch[0].toUpperCase().replace(/\s/g, '-');
  const marca = linha.trim().split(/\s+/)[0];
  return { matricula, marca };
}

async function seed() {
  const existentes = await client.execute('SELECT COUNT(*) AS n FROM viaturas');
  if (existentes.rows[0].n > 0) {
    console.log(`Ja existem ${existentes.rows[0].n} viatura(s) na base de dados - seed cancelado para nao duplicar. Usa o ecra de Viaturas para adicionar as restantes.`);
    return;
  }

  const conteudo = fs.readFileSync(INDEX_PATH, 'utf8');
  const linhas = conteudo.split('\n').map(l => l.trim()).filter(Boolean).filter(l => !l.startsWith('#'));

  const inseridas = [];
  for (const linha of linhas) {
    const dados = parseLinha(linha);
    if (!dados) {
      console.warn(`Linha ignorada (nao reconhecida como viatura): "${linha}"`);
      continue;
    }
    await client.execute({
      sql: 'INSERT INTO viaturas (matricula, marca, ativo) VALUES (?, ?, 1)',
      args: [dados.matricula, dados.marca]
    });
    inseridas.push(dados);
  }

  console.log(`Migradas ${inseridas.length} viatura(s) de Index-viaturas.md:`);
  inseridas.forEach(v => console.log(`  - ${v.marca} (${v.matricula})`));
  console.log('Completa os restantes dados (modelo, capacidade do deposito, km atual) no ecra de Viaturas.');
}

seed()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Erro ao migrar viaturas existentes:', err);
    process.exit(1);
  });
