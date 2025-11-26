export const schema = `
CREATE TABLE IF NOT EXISTS consensus_sessions (
  id TEXT PRIMARY KEY,
  prompt TEXT NOT NULL,
  status TEXT NOT NULL, -- 'running', 'completed', 'failed'
  result TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS responses (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  content TEXT NOT NULL,
  iteration INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(session_id) REFERENCES consensus_sessions(id)
);

CREATE TABLE IF NOT EXISTS evaluations (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  evaluator_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  scores TEXT NOT NULL, -- JSON string of {accuracy, relevance, completeness, clarity}
  feedback TEXT,
  total_score REAL NOT NULL,
  iteration INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(session_id) REFERENCES consensus_sessions(id)
);

CREATE TABLE IF NOT EXISTS chunks (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  token_count INTEGER NOT NULL,
  result TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(session_id) REFERENCES consensus_sessions(id)
);
`;

