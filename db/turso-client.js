require('dotenv').config();
const { createClient } = require('@libsql/client');

const url = process.env.TURSO_DATABASE_URL || 'file:' + require('path').join(__dirname, 'local-dev.db');
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!process.env.TURSO_DATABASE_URL) {
  console.warn('[db] TURSO_DATABASE_URL nao definido - a usar base de dados local de desenvolvimento (db/local-dev.db). Define TURSO_DATABASE_URL e TURSO_AUTH_TOKEN no .env para ligar ao Turso.');
}

const client = createClient(authToken ? { url, authToken } : { url });

module.exports = client;
