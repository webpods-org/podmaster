import mkdirp from "mkdirp";
import { join } from "path";

import * as db from "../../db/index.js";
import ensurePod from "../pods/internal/ensurePod.js";
import { LogsRow } from "../../types/db.js";
import { generateInsertStatement } from "../../lib/sqlite.js";
import { getPodDataDir } from "../../storage/index.js";
import { HttpError, JwtClaims } from "../../types/index.js";
import getPodPermissionForJwt from "../pods/internal/getPodPermissionForJwt.js";
import { isAlphanumeric } from "../../api/utils/isAlphanumeric.js";
import addLogPermission from "../permissions/internal/addLogPermission.js";
import { StatusCodes } from "http-status-codes";
import { InvalidResult, ValidResult } from "../../Result.js";
import { default as getLogs } from "./internal/getLogs.js";

export type CreateLogResult = {};

export default async function createLog(
  hostname: string,
  logId: string,
  logName: string,
  logDescription: string,
  publik: boolean | undefined,
  userClaims: JwtClaims
): Promise<ValidResult<CreateLogResult> | InvalidResult<HttpError>> {
  return ensurePod(hostname, async (pod) => {
    // Check fields
    const validationErrors = validateInput({ logId });

    if (validationErrors instanceof InvalidResult) {
      return validationErrors;
    }

    const podDataDir = getPodDataDir(pod.id);
    const logDir = join(podDataDir, logId);
    const podDb = db.getPodDb(podDataDir);

    const podPermission = await getPodPermissionForJwt(
      pod.app,
      podDb,
      userClaims
    );

    const existingLogs = await getLogs(pod, podPermission);

    if (existingLogs instanceof InvalidResult) {
      return new InvalidResult({
        error: "Access denied.",
        status: StatusCodes.UNAUTHORIZED,
      });
    }

    if (existingLogs.value.logs.some((x) => x.id === logId)) {
      return new InvalidResult({
        error: `The log ${logId} already exists.`,
        status: StatusCodes.CONFLICT,
      });
    }

    const logsRow: LogsRow = {
      id: logId,
      name: logName,
      description: logDescription || "",
      created_at: Date.now(),
      public: publik ? 1 : 0,
    };

    const insertLogStmt = podDb.prepare(
      generateInsertStatement<LogsRow>("log", logsRow)
    );

    insertLogStmt.run(logsRow);

    // Creator gets full permissions.
    await addLogPermission(
      logId,
      {
        iss: userClaims.iss,
        sub: userClaims.sub,
      },
      {
        read: true,
        write: true,
        publish: true,
        subscribe: true,
      },
      false,
      podDb
    );

    await mkdirp(logDir);

    const result: CreateLogResult = {};
    return new ValidResult(result);
  });
}

function validateInput(input: {
  logId: string;
}): InvalidResult<HttpError> | null {
  if (!input.logId) {
    return new InvalidResult({
      error: "Missing fields in input.",
      status: StatusCodes.BAD_REQUEST,
    });
  } else if (!isAlphanumeric(input.logId)) {
    return new InvalidResult({
      error: "Log name can only contains letters, numbers and hyphens.",
      status: StatusCodes.BAD_REQUEST,
    });
  }
  return null;
}
