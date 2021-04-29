import * as config from "../../config";
import * as fs from "fs";
import * as path from "path";
import Database = require("better-sqlite3");

export async function createLog(hostname: string, logName: string) {
  const dataDir = await getPodDirectory(hostname);

  // Check if db exists.
  const dbPath = path.join(dataDir, "pod.sqlite");
  const db = new Database(dbPath);
}

export async function getPodDirectory(hostname: string): Promise<string> {
  const appConfig = config.get();

  if (appConfig.mode === "local") {
    for (const pods of appConfig.pods) {
      return pods.dataDir;
    }
  } 
  // For public pod servers, we need to do this based on:
  // 1. Directory nesting
  // 2. Hash of hostname
  else if (appConfig.mode === "public") {
    throw new Error("Not implemented.");
  }

  // It'll never get here.
  throw new Error("Cannot find data directory.");
}

export async function getPod() {
  
}
