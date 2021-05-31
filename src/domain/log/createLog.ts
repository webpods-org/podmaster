import * as config from "../../config";
import * as db from "../../db";
import mapper from "../../mappers/pod";
import { DomainResult as DomainResult } from "../../types/api";
import { MISSING_POD } from "../../errors/codes";
import { join } from "path";
import random from "../../utils/random";
import mkdirp = require("mkdirp");
import { getPodByHostname } from "../pod/getPodByHostname";

export type CreateLogResult = {
  log: string
};

export default async function createLog(
  issuer: string,
  username: string,
  hostname: string,
  tags: string
): Promise<DomainResult<{ log: string }>> {
  const appConfig = config.get();
  const sqlite = db.get();

  const pod = await getPodByHostname(issuer, username, hostname)
  
  if (pod) {
    // Let's see if the log already exists.
    const podDir = join(appConfig.storage.dataDir, pod.dataDir);
    const log = generateLogId();
    const logDir = join(podDir, log);

    const insertLogStmt = sqlite.prepare(
      "INSERT INTO logs VALUES (@pod, @log, @created_at, @tags)"
    );

    insertLogStmt.run({
      pod: pod.pod,
      log: log,
      created_at: Date.now(),
      tags: tags || "",
    });

    await mkdirp(logDir);

    return {
      success: true,
      log: log,
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
