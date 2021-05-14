import Sqlite3 = require("better-sqlite3");
import * as config from "../config";
import * as path from "path";
import { readFile, readFileSync } from "fs";
import { join } from "path";

let db: Sqlite3.Database;

export async function init() {
  const appConfig = config.get();
  db = new Sqlite3(path.join(appConfig.storage.dataDir, "webpodssysdb.sqlite"));
  await ensureTablesExist();
}

async function ensureTablesExist() {
  const createTablesSql = readFileSync(
    join(__dirname, "createTables.sql"),
    "utf8"
  ).toString();

  db.exec(createTablesSql);
}

export function get(): Sqlite3.Database {
  return db;
}
