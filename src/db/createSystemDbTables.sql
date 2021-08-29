CREATE TABLE IF NOT EXISTS pods (
	"iss" TEXT NOT NULL,
  "sub" TEXT NOT NULL,
  "name" TEXT NOT NULL UNIQUE,
  "hostname" TEXT NOT NULL UNIQUE,
  "hostname_alias" TEXT UNIQUE,
	"created_at" INTEGER NOT NULL,
  "tier" TEXT NOT NULL,
  "description" TEXT NOT NULL,
	PRIMARY KEY ("iss", "sub", "name")
);
