CREATE TABLE IF NOT EXISTS pod_permissions (
	"iss" INTEGER,
  "sub" TEXT NOT NULL UNIQUE,
  "admin" INTEGER NOT NULL,
  "read" INTEGER NOT NULL,
  "write" INTEGER NOT NULL,
  "created_at" INTEGER NOT NULL,
  PRIMARY KEY ("iss", "sub")  
);

CREATE TABLE IF NOT EXISTS logs (
	"name" TEXT NOT NULL UNIQUE,
  "public" INTEGER NOT NULL,
  "created_at" INTEGER NOT NULL,
  "tags" TEXT NOT NULL,
  PRIMARY KEY ("name")
);

CREATE TABLE IF NOT EXISTS entries (
  "id" INTEGER,
  "type" TEXT NOT NULL,
  "content_hash" TEXT NOT NULL,
  "commit" TEXT NOT NULL UNIQUE,
  "previous_commit" TEXT NOT NULL UNIQUE,
	"log_name" TEXT NOT NULL,
  "data" TEXT NOT NULL,
  "created_at" INTEGER NOT NULL,
  "iss" TEXT NOT NULL,
  "sub" TEXT NOT NULL,
  PRIMARY KEY ("id")
  FOREIGN KEY ("log_name") REFERENCES logs("name")
);

CREATE TABLE IF NOT EXISTS log_permissions (
	"log_name" TEXT NOT NULL,
  "iss" INTEGER,
  "sub" TEXT NOT NULL UNIQUE,
  "read" INTEGER NOT NULL,
  "write" INTEGER NOT NULL,
  "publish" INTEGER NOT NULL,
  "subscribe" INTEGER NOT NULL,
  "created_at" INTEGER NOT NULL,
  PRIMARY KEY ("iss", "sub", "log_name")
  FOREIGN KEY ("log_name") REFERENCES logs("name")
);