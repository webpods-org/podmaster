CREATE TABLE IF NOT EXISTS pods (
	"iss" TEXT NOT NULL,
  "sub" TEXT NOT NULL,
  "pod" TEXT NOT NULL UNIQUE,
  "hostname" TEXT NOT NULL UNIQUE,
  "hostname_alias" TEXT UNIQUE,
	"created_at" INTEGER NOT NULL,
  "data_dir" TEXT NOT NULL,
  "tier" TEXT NOT NULL,
	PRIMARY KEY (iss, sub, pod)
);