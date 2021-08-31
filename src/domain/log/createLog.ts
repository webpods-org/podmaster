import mkdirp from "mkdirp";
import { join } from "path";

import * as db from "../../db/index.js";
import { Result } from "../../types/api.js";
import ensurePod from "../pod/ensurePod.js";
import { ACCESS_DENIED, LOG_EXISTS } from "../../errors/codes.js";
import { LogsRow } from "../../types/db.js";
import { generateInsertStatement } from "../../lib/sqlite.js";
import { getPodDataDir } from "../../storage/index.js";
import getLogs from "./getLogs.js";
import { JwtClaims } from "../../types/types.js";
import { getPodPermissionsForJwt } from "../pod/getPodPermissionsForJwt.js";

export type CreateLogResult = {};

export default async function createLog(
  hostname: string,
  logId: string,
  logName: string,
  logDescription: string,
  publik: boolean | undefined,
  userClaims: JwtClaims
): Promise<Result<CreateLogResult>> {
  return ensurePod(hostname, async (pod) => {
    const podDataDir = getPodDataDir(pod.id);
    const logDir = join(podDataDir, logId);
    const podDb = db.getPodDb(podDataDir);

    const podPermissions = await getPodPermissionsForJwt(podDb, userClaims);

    if (podPermissions.write) {
      // Let's see if the log already exists.
      const existingLogsResult = await getLogs(hostname, userClaims);

      if (existingLogsResult.ok) {
        if (!existingLogsResult.value.logs.some((x) => x.id === logId)) {
          const logsRow: LogsRow = {
            id: logId,
            name: logName,
            description: logDescription || "",
            created_at: Date.now(),
            public: publik ? 1 : 0,
          };

          const insertLogStmt = podDb.prepare(
            generateInsertStatement("logs", logsRow)
          );

          insertLogStmt.run(logsRow);

          await mkdirp(logDir);

          return {
            ok: true,
            value: {},
          };
        } else {
          return {
            ok: false,
            code: LOG_EXISTS,
            error: `The log ${logId} already exists.`,
          };
        }
      } else {
        return existingLogsResult;
      }
    } else {
      return {
        ok: false,
        code: ACCESS_DENIED,
        error: "Access denied.",
      };
    }
  });
}
