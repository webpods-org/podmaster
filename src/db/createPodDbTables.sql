CREATE TABLE IF NOT EXISTS pod_permission (
	"iss" TEXT NOT NULL,
  "sub" TEXT NOT NULL,
  "read" INTEGER NOT NULL,
  "write" INTEGER NOT NULL,
  "created_at" INTEGER NOT NULL,
  PRIMARY KEY ("iss", "sub")  
);

CREATE TABLE IF NOT EXISTS log (
	"id" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL UNIQUE,
  "description" TEXT NOT NULL,
  "public" INTEGER NOT NULL,
  "created_at" INTEGER NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS log_entry (
  "id" INTEGER,
  "type" TEXT NOT NULL,
  "content_hash" TEXT NOT NULL,
  "commit" TEXT NOT NULL UNIQUE,
  "previous_commit" TEXT NOT NULL UNIQUE,
	"log_id" TEXT NOT NULL,
  "data" TEXT NOT NULL,
  "created_at" INTEGER NOT NULL,
  "iss" TEXT NOT NULL,
  "sub" TEXT NOT NULL,
  PRIMARY KEY ("id")
  FOREIGN KEY ("log_id") REFERENCES log("id")
);

CREATE TABLE IF NOT EXISTS log_permission (
	"log_id" TEXT NOT NULL,
  "iss" TEXT NOT NULL,
  "sub" TEXT NOT NULL,
  "read" INTEGER NOT NULL,
  "write" INTEGER NOT NULL,
  "publish" INTEGER NOT NULL,
  "subscribe" INTEGER NOT NULL,
  "created_at" INTEGER NOT NULL,
  PRIMARY KEY ("iss", "sub", "log_id")
  FOREIGN KEY ("log_id") REFERENCES log("id")
);

CREATE TABLE IF NOT EXISTS permission_token (
  "id" TEXT NOT NULL UNIQUE,
  "permissions_json" TEXT NOT NULL,
  "max_redemptions" INTEGER NOT NULL,
  "redemptions" INTEGER NOT NULL,
  "expiry" INTEGER NOT NULL,
  "created_at" INTEGER NOT NULL,
  PRIMARY KEY ("id")
);