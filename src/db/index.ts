import * as path from "path";
import { readFileSync } from "fs";
import { join } from "path";
import Sqlite3 from "better-sqlite3";
import { dirname } from "path";
import { fileURLToPath } from "url";

import * as config from "../config/index.js";
import { LRUMap } from "../lib/lruCache/lru.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let podDbCache: LRUMap<string, Sqlite3.Database>;
let systemDb: Sqlite3.Database;

export async function init(): Promise<void> {
  const appConfig = config.get();
  systemDb = new Sqlite3(
    path.join(appConfig.storage.dataDir, "podmaster.sqlite")
  );
  await ensureTablesExist();
  podDbCache = new LRUMap(appConfig.podDbCacheSize || 100);

  podDbCache.shift = function onCacheEvict() {
    const entry: [string, Sqlite3.Database] | undefined =
      LRUMap.prototype.shift.call(this);
    if (entry) {
      const [, value] = entry;
      value.close();
      return entry;
    }
  };
}

async function ensureTablesExist(): Promise<void> {
  const createTablesSql = readFileSync(
    join(__dirname, "createSystemDbTables.sql"),
    "utf8"
  ).toString();

  systemDb.exec(createTablesSql);
}

export async function initPodDb(db: Sqlite3.Database): Promise<void> {
  const createTablesSql = readFileSync(
    join(__dirname, "createPodDbTables.sql"),
    "utf8"
  ).toString();

  db.exec(createTablesSql);
}

export function getSystemDb(): Sqlite3.Database {
  return systemDb;
}

export function getPodDb(podDataDir: string): Sqlite3.Database {
  const db = podDbCache.find(podDataDir);
  if (db) {
    return db;
  } else {
    const podDb = new Sqlite3(path.join(podDataDir, "pod.sqlite"));
    podDbCache.set(podDataDir, podDb);
    return podDb;
  }
}
