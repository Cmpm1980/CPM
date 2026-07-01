CREATE TABLE IF NOT EXISTS utilizadores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('responsavel','motorista')),
  pin_hash TEXT NOT NULL,
  ativo INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT DEFAULT (datetime('now'))
);

-- Token de longa duracao para o PWA autenticar submissoes feitas offline,
-- horas ou dias depois do login, sem depender da sessao em memoria do servidor
-- (que pode perder-se caso o servico cloud reinicie enquanto o telemovel estava offline).
CREATE TABLE IF NOT EXISTS tokens_dispositivo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL UNIQUE,
  utilizador_id INTEGER NOT NULL REFERENCES utilizadores(id),
  criado_em TEXT DEFAULT (datetime('now')),
  revogado INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS viaturas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  matricula TEXT NOT NULL,
  marca TEXT,
  modelo TEXT,
  capacidade_deposito_litros REAL,
  km_atual INTEGER DEFAULT 0,
  motorista_habitual_id INTEGER REFERENCES utilizadores(id),
  departamento TEXT,
  ativo INTEGER NOT NULL DEFAULT 1,
  observacoes TEXT,
  criado_em TEXT DEFAULT (datetime('now')),
  atualizado_em TEXT DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_viaturas_matricula ON viaturas(matricula);

CREATE TABLE IF NOT EXISTS abastecimentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_uuid TEXT UNIQUE,
  viatura_id INTEGER NOT NULL REFERENCES viaturas(id),
  data_hora TEXT NOT NULL DEFAULT (datetime('now')),
  litros REAL NOT NULL,
  km_odometro INTEGER NOT NULL,
  utilizador_id INTEGER NOT NULL REFERENCES utilizadores(id),
  modo_acesso TEXT NOT NULL CHECK(modo_acesso IN ('responsavel','motorista')),
  origem_registo TEXT NOT NULL DEFAULT 'online' CHECK(origem_registo IN ('online','sincronizado_offline')),
  revisto_por_responsavel INTEGER NOT NULL DEFAULT 0,
  revisto_em TEXT,
  anulado INTEGER NOT NULL DEFAULT 0,
  observacoes TEXT
);
CREATE INDEX IF NOT EXISTS idx_abastecimentos_viatura ON abastecimentos(viatura_id, data_hora);

CREATE TABLE IF NOT EXISTS deposito_movimentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL CHECK(tipo IN ('entrada','saida','ajuste')),
  litros REAL NOT NULL,
  data_hora TEXT NOT NULL DEFAULT (datetime('now')),
  origem TEXT,
  fatura_referencia TEXT,
  abastecimento_id INTEGER REFERENCES abastecimentos(id),
  criado_por INTEGER NOT NULL REFERENCES utilizadores(id),
  observacoes TEXT
);
CREATE INDEX IF NOT EXISTS idx_deposito_data ON deposito_movimentos(data_hora);
