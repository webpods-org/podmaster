import Sqlite3 = require("better-sqlite3");
import * as config from "../config";
import * as path from "path";

let db: Sqlite3.Database;

export async function init() {
  const appConfig = config.get();
  db = new Sqlite3(path.join(appConfig.storage.dataDir, "webpodssysdb.sqlite"));
}

export function get() : Sqlite3.Database {
  return db;
}
