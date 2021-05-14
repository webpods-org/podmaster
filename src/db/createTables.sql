CREATE TABLE IF NOT EXISTS pods (
  issuer TEXT NOT NULL,
	user_id TEXT NOT NULL,
  hostname TEXT NOT NULL,
	created_at INTEGER NOT NULL,
  tier TEXT NOT NULL,
  dir TEXT NOT NULL,
	PRIMARY KEY (issuer, user_id)
);