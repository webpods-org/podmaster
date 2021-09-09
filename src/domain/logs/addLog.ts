import mkdirp from "mkdirp";
import { join } from "path";

import * as db from "../../db/index.js";
import { ErrResult, Result } from "../../types/api.js";
import ensurePod from "../pods/util/ensurePod.js";
import {
  ACCESS_DENIED,
  INVALID_LOG_NAME,
  LOG_EXISTS,
  MISSING_FIELD,
} from "../../errors/codes.js";
import { LogsRow } from "../../types/db.js";
import { generateInsertStatement } from "../../lib/sqlite.js";
import { getPodDataDir } from "../../storage/index.js";
import getLogs from "./getLogs.js";
import { JwtClaims } from "../../types/types.js";
import getPodPermissionsForJwt from "../pods/util/getPodPermissionsForJwt.js";
import { isAlphanumeric } from "../../api/utils/isAlphanumeric.js";

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
    // Check fields
    const validationErrors = validateInput({ logId });

    if (!validationErrors) {
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
              generateInsertStatement<LogsRow>("logs", logsRow)
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
    } else {
      return validationErrors;
    }
  });
}

function validateInput(input: { logId: string }): ErrResult | undefined {
  if (!input.logId) {
    return {
      ok: false,
      error: "Missing fields in input.",
      code: MISSING_FIELD,
      data: {
        fields: ["id"],
      },
    };
  } else if (!isAlphanumeric(input.logId)) {
    return {
      ok: false,
      error: "Log id can only contains letters, numbers and hyphens.",
      code: INVALID_LOG_NAME,
    };
  }
}
