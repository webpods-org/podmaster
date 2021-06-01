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
  log: string;
};

export default async function createLog(
  issuer: string,
  subject: string,
  hostname: string,
  tags: string
): Promise<DomainResult<CreateLogResult>> {
  const appConfig = config.get();

  const pod = await getPodByHostname(issuer, subject, hostname);

  if (pod) {
    // Let's see if the log already exists.
    const podDataDir = join(appConfig.storage.dataDir, pod.dataDir);

    const log = generateLogId();
    const logDir = join(podDataDir, log);

    const podDb = db.getPodDb(podDataDir);

    const insertLogStmt = podDb.prepare(
      "INSERT INTO logs VALUES (@log, @created_at, @tags)"
    );

    insertLogStmt.run({
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
