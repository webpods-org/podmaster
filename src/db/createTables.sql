CREATE TABLE IF NOT EXISTS pods (
	identity_issuer TEXT NOT NULL,
  identity_username TEXT NOT NULL,
  pod_id TEXT NOT NULL UNIQUE,
  hostname TEXT NOT NULL UNIQUE,
  hostname_alias TEXT UNIQUE,
	created_at INTEGER NOT NULL,
  data_dir TEXT NOT NULL,
  tier TEXT NOT NULL,
	PRIMARY KEY (identity_issuer, identity_username, pod_id)
);