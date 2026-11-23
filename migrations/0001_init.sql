CREATE TABLE items (item_id TEXT PRIMARY KEY, token TEXT NOT NULL, cursor TEXT, accounts TEXT NOT NULL);
CREATE TABLE transactions (id TEXT PRIMARY KEY, item_id TEXT NOT NULL, raw TEXT NOT NULL);
CREATE INDEX transactions_item ON transactions(item_id);
CREATE TABLE overrides (id TEXT PRIMARY KEY, category TEXT NOT NULL, excluded INTEGER NOT NULL);
CREATE TABLE state (key TEXT PRIMARY KEY, value TEXT NOT NULL);
