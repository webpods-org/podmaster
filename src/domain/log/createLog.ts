import * as config from "../../config";
import * as db from "../../db";
import { join } from "path";
import random from "../../utils/random";
import mkdirp = require("mkdirp");
import { Result } from "../../types/api";
import ensurePod from "./ensurePod";
import { ACCESS_DENIED } from "../../errors/codes";
export type CreateLogResult = {
  log: string;
};

export default async function createLog(
  iss: string | undefined,
  sub: string | undefined,
  hostname: string,
  publik?: boolean,
  tags?: string
): Promise<Result<CreateLogResult>> {
  const appConfig = config.get();

  return ensurePod(hostname, async (pod) => {
    // Is it own pod?
    if (pod.claims.iss === iss && pod.claims.sub === sub) {
      // Let's see if the log already exists.
      const podDataDir = join(appConfig.storage.dataDir, pod.dataDir);

      const log = generateLogId();
      const logDir = join(podDataDir, log);

      const podDb = db.getPodDb(podDataDir);

      const insertLogStmt = podDb.prepare(
        `INSERT INTO "logs" VALUES (@log, @created_at, @public, @tags)`
      );

      insertLogStmt.run({
        log: log,
        created_at: Date.now(),
        public: publik ? 1 : 0,
        tags: tags || "",
      });

      await mkdirp(logDir);

      return {
        ok: true,
        log: log,
      };
    } else {
      return {
        ok: false,
        code: ACCESS_DENIED,
        error: "Access denied.",
      };
    }
  });
}

function generateLogId() {
  return random(8);
}
