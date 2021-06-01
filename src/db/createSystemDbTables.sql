CREATE TABLE IF NOT EXISTS pods (
	issuer TEXT NOT NULL,
  subject TEXT NOT NULL,
  pod TEXT NOT NULL UNIQUE,
  hostname TEXT NOT NULL UNIQUE,
  hostname_alias TEXT UNIQUE,
	created_at INTEGER NOT NULL,
  data_dir TEXT NOT NULL,
  tier TEXT NOT NULL,
	PRIMARY KEY (issuer, subject, pod)
);