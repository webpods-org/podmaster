import mkdirp from "mkdirp";
import { join } from "path";

import * as config from "../../config/index.js";
import * as db from "../../db/index.js";
import random from "../../utils/random.js";
import { Result } from "../../types/api.js";
import ensurePod from "../pod/ensurePod.js";
import { ACCESS_DENIED } from "../../errors/codes.js";
import { LogsRow } from "../../types/db.js";
import { generateInsertStatement } from "../../lib/sqlite.js";
export type CreateLogResult = {
  log: string;
};

export default async function createLog(
  iss: string,
  sub: string,
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

      const logsRow: LogsRow = {
        log: log,
        created_at: Date.now(),
        public: publik ? 1 : 0,
        tags: tags || "",
      };

      const insertLogStmt = podDb.prepare(
        generateInsertStatement("logs", logsRow)
      );

      insertLogStmt.run(logsRow);

      await mkdirp(logDir);

      return {
        ok: true,
        value: { log: log },
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
