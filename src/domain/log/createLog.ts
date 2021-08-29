import mkdirp from "mkdirp";
import { join } from "path";

import * as db from "../../db/index.js";
import { Result } from "../../types/api.js";
import ensurePod from "../pod/ensurePod.js";
import { ACCESS_DENIED, LOG_EXISTS } from "../../errors/codes.js";
import { LogsRow } from "../../types/db.js";
import { generateInsertStatement } from "../../lib/sqlite.js";
import { getPodDataDir } from "../../storage/index.js";
import getPermissions from "../pod/getPermissions.js";
import getLogs from "./getLogs.js";

export type CreateLogResult = {
  name: string;
};

export default async function createLog(
  iss: string,
  sub: string,
  hostname: string,
  logName: string,
  publik?: boolean,
  tags?: string
): Promise<Result<CreateLogResult>> {
  return ensurePod(hostname, async (pod) => {
    const podPermissionsResult = await getPermissions(iss, sub, hostname);

    if (podPermissionsResult.ok) {
      const canCreate = podPermissionsResult.value.permissions.some(
        (x) =>
          (x.claims.iss === iss && x.claims.sub === sub && x.access.admin) ||
          x.access.write
      );

      if (canCreate) {
        const podDataDir = getPodDataDir(pod.name);
        const logDir = join(podDataDir, logName);
        const podDb = db.getPodDb(podDataDir);
        
        // Let's see if the log already exists.
        const existingLogsResult = await getLogs(iss, sub, hostname, undefined);
        
        if (existingLogsResult.ok) {
          if (!existingLogsResult.value.logs.some((x) => x.name === logName)) {
            const logsRow: LogsRow = {
              name: logName,
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
              value: { name: logName },
            };
          } else {
            return {
              ok: false,
              code: LOG_EXISTS,
              error: `The log ${logName} already exists.`,
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
    } else {
      return podPermissionsResult;
    }
  });
}
