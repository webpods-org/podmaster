import * as db from "../../../db/index.js";
import ensurePod from "../../pods/internal/ensurePod.js";
import { EntriesRow } from "../../../types/db.js";
import getLogPermissionForJwt from "../internal/getLogPermissionForJwt.js";
import { getPodDataDir } from "../../../storage/index.js";
import { HttpError, JwtClaims } from "../../../types/index.js";
import { StatusCodes } from "http-status-codes";
import { InvalidResult, ValidResult } from "../../../Result.js";

export type GetInfoResult = {
  id: number;
  commit: string;
};

export default async function getInfo(
  hostname: string,
  logId: string,
  userClaims: JwtClaims | undefined
): Promise<ValidResult<GetInfoResult> | InvalidResult<HttpError>> {
  return ensurePod(hostname, async (pod) => {
    // Let's see if the log already exists.
    const podDataDir = getPodDataDir(pod.id);
    const podDb = db.getPodDb(podDataDir);

    const logPermission = await getLogPermissionForJwt(
      pod.app,
      logId,
      podDb,
      userClaims
    );

    if (!logPermission.read) {
      return new InvalidResult({
        error: "Access denied.",
        status: StatusCodes.UNAUTHORIZED,
      });
    }
    
    // Get the last item
    const lastItemStmt = podDb.prepare(
      `SELECT "id", "commit" FROM "log_entry" ORDER BY id DESC LIMIT 1`
    );

    const { id, commit } = (lastItemStmt.get() as EntriesRow | undefined) || {
      id: 0,
      commit: "",
    };

    const result: GetInfoResult = {
      id,
      commit,
    };
    return new ValidResult(result);
  });
}
