CREATE TABLE accounts (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);
INSERT INTO accounts (id, name) VALUES (1, 'Spending'), (2, 'Savings');

CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  direction TEXT NOT NULL CHECK (direction IN ('in','out')),
  category TEXT NOT NULL,
  amount REAL NOT NULL CHECK (amount > 0),
  comment TEXT NOT NULL DEFAULT '',
  is_transfer INTEGER NOT NULL DEFAULT 0,
  linked_transaction_id INTEGER REFERENCES transactions(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_transactions_account_date ON transactions(account_id, date, id);
CREATE INDEX idx_transactions_date ON transactions(date, id);
