import * as db from "../../db/index.js";
import { HttpError, PodJwtClaims, LogAccess } from "../../types/index.js";
import ensurePod from "../pods/internal/ensurePod.js";
import { PermissionTokensRow } from "../../types/db.js";
import { generateInsertStatement } from "../../lib/sqlite.js";
import { getPodDataDir } from "../../storage/index.js";
import getPodPermissionForJwt from "../pods/internal/getPodPermissionForJwt.js";
import random from "../../utils/random.js";
import { StatusCodes } from "http-status-codes";
import { InvalidResult, ValidResult } from "../../Result.js";

export type CreatePermissionTokenResult = {
  id: string;
};

export default async function createPermissionTokens(
  hostname: string,
  permissions: {
    logs?: {
      log: string;
      access: LogAccess;
    }[];
  },
  maxRedemptions: number,
  expiry: number,
  userClaims: PodJwtClaims
): Promise<
  ValidResult<CreatePermissionTokenResult> | InvalidResult<HttpError>
> {
  return ensurePod(hostname, async (pod) => {
    // Let's see if the log already exists.
    const podDataDir = getPodDataDir(pod.id);
    const podDb = db.getPodDb(podDataDir);

    const podPermission = await getPodPermissionForJwt(
      pod.app,
      podDb,
      userClaims
    );

    if (!podPermission.write) {
      return new InvalidResult({
        error: "Access denied.",
        status: StatusCodes.UNAUTHORIZED,
      });
    }
    
    const id = random();
    const permissionsJson = JSON.stringify(permissions);

    const permissionTokensRow: PermissionTokensRow = {
      id,
      permissions_json: permissionsJson,
      max_redemptions: maxRedemptions,
      redemptions: 0,
      expiry: expiry,
      created_at: Date.now(),
    };

    const insertStmt = podDb.prepare(
      generateInsertStatement<PermissionTokensRow>(
        "permission_token",
        permissionTokensRow
      )
    );

    insertStmt.run(permissionTokensRow);

    const result: CreatePermissionTokenResult = { id };
    return new ValidResult(result);
  });
}
