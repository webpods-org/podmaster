CREATE TABLE IF NOT EXISTS pod (
	"iss" TEXT NOT NULL,
  "sub" TEXT NOT NULL,
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "app" TEXT NOT NULL,
  "hostname" TEXT NOT NULL UNIQUE,
  "hostname_alias" TEXT UNIQUE,
	"created_at" INTEGER NOT NULL,
  "tier" TEXT NOT NULL,
  "description" TEXT NOT NULL,
	PRIMARY KEY ("iss", "sub", "id")
);
