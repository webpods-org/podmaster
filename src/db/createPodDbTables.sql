CREATE TABLE IF NOT EXISTS logs (
	"log" TEXT NOT NULL UNIQUE,
  "public" INTEGER NOT NULL,
  "created_at" INTEGER NOT NULL,
  "tags" TEXT NOT NULL,
  PRIMARY KEY (log)
);

CREATE TABLE IF NOT EXISTS entries (
  "id" INTEGER,
  "type" TEXT NOT NULL,
  "content_hash" TEXT NOT NULL,
  "commit" TEXT NOT NULL UNIQUE,
  "previous_commit" TEXT NOT NULL UNIQUE,
	"log" TEXT NOT NULL,
  "data" TEXT NOT NULL,
  "created_at" INTEGER NOT NULL,
  "iss" TEXT NOT NULL,
  "sub" TEXT NOT NULL,
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
  "publish" INTEGER NOT NULL,
  "subscribe" INTEGER NOT NULL,
  "created_at" INTEGER NOT NULL,
  PRIMARY KEY (iss, sub, log)
);