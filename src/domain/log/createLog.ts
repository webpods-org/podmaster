import * as config from "../../config";
import * as db from "../../db";
import { ACCESS_DENIED, MISSING_POD } from "../../errors/codes";
import { join } from "path";
import random from "../../utils/random";
import mkdirp = require("mkdirp");
import { getPodByHostname } from "../pod/getPodByHostname";
import { Result } from "../../types/api";
import ensurePod from "./ensurePod";
import ensureOwnPod from "./ensureOwnPod";

export type CreateLogResult = {
  log: string;
};

export default async function createLog(
  iss: string,
  sub: string,
  hostname: string,
  tags: string
): Promise<Result<CreateLogResult>> {
  const appConfig = config.get();

  return ensureOwnPod(iss, sub, hostname, async (pod) => {
    // Let's see if the log already exists.
    const podDataDir = join(appConfig.storage.dataDir, pod.dataDir);

    const log = generateLogId();
    const logDir = join(podDataDir, log);

    const podDb = db.getPodDb(podDataDir);

    const insertLogStmt = podDb.prepare(
      `INSERT INTO "logs" VALUES (@log, @created_at, @tags)`
    );

    insertLogStmt.run({
      log: log,
      created_at: Date.now(),
      tags: tags || "",
    });

    await mkdirp(logDir);

    return {
      ok: true,
      log: log,
    };
  });
}

function generateLogId() {
  return random(8);
}
