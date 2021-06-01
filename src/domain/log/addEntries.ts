import * as config from "../../config";
import * as db from "../../db";
import mapper from "../../mappers/pod";
import { DomainResult as DomainResult } from "../../types/api";
import { MISSING_POD } from "../../errors/codes";
import { join } from "path";
import random from "../../utils/random";
import mkdirp = require("mkdirp");
import { getPodByHostname } from "../pod/getPodByHostname";
import { Files } from "formidable";

export type AddEntriesResult = {};

export type LogEntry = {
  data: string;
  encoding?: "utf-8";
  previousCommit?: string;
};

export default async function addEntries(
  issuer: string,
  username: string,
  hostname: string,
  entries: LogEntry[],
  files: Files | undefined
): Promise<DomainResult<AddEntriesResult>> {
  const appConfig = config.get();
  const sqlite = db.getSystemDb();

  const pod = await getPodByHostname(issuer, username, hostname);

  if (pod) {
    // Let's see if the log already exists.
    const podDir = join(appConfig.storage.dataDir, pod.dataDir);
    
    
    const log = generateLogId();
    const logDir = join(podDir, log);
    // const insertLogStmt = sqlite.prepare(
    //   "INSERT INTO logs VALUES (@pod, @log, @created_at, @tags)"
    // );
    // insertLogStmt.run({
    //   pod: pod.pod,
    //   log: log,
    //   created_at: Date.now(),
    //   tags: tags || "",
    // });
    // await mkdirp(logDir);
    return {
      success: true,
    };
  } else {
    return {
      success: false,
      code: MISSING_POD,
      error: "Pod not found.",
    };
  }
}

function generateLogId() {
  return random(8);
}
