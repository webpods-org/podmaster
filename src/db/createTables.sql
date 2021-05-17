CREATE TABLE IF NOT EXISTS pods (
	identity_issuer TEXT NOT NULL,
  identity_username TEXT NOT NULL,
  pod TEXT NOT NULL UNIQUE,
	created_at INTEGER NOT NULL,
  dir TEXT NOT NULL,
  tier TEXT NOT NULL,
	PRIMARY KEY (identity_issuer, identity_username)
);