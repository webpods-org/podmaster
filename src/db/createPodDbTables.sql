CREATE TABLE IF NOT EXISTS logs (
	"log" TEXT NOT NULL UNIQUE,
  "created_at" INTEGER NOT NULL,
  "tags" TEXT NOT NULL,
  PRIMARY KEY (log)
);

CREATE TABLE IF NOT EXISTS entries (
  "id" INTEGER,
  "commit" TEXT NOT NULL UNIQUE,
  "previous_commit" TEXT NOT NULL UNIQUE,
	"log" TEXT NOT NULL,
  "data" TEXT NOT NULL,
  "created_at" INTEGER NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS permissions (
	"log" TEXT NOT NULL,
  "iss" INTEGER,
  "sub" TEXT NOT NULL UNIQUE,
  "read" INTEGER NOT NULL,
  "write" INTEGER NOT NULL,
  "admin" INTEGER NOT NULL,
  "metadata" INTEGER NOT NULL,
  "created_at" INTEGER NOT NULL,
  PRIMARY KEY (iss, sub, log)
);