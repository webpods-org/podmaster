import * as db from "../../db/index.js";
import { HttpError, JwtClaims, PermissionToken } from "../../types/index.js";
import permissionTokenMapper from "../../mappers/permissionToken.js";
import ensurePod from "../pods/internal/ensurePod.js";
import { getPodDataDir } from "../../storage/index.js";
import getPodPermissionForJwt from "../pods/internal/getPodPermissionForJwt.js";
import { StatusCodes } from "http-status-codes";
import { InvalidResult, ValidResult } from "../../Result.js";

export type GetPermissionsTokensResult = {
  permissionTokens: PermissionToken[];
};

export default async function getPermissionTokens(
  hostname: string,
  userClaims: JwtClaims
): Promise<ValidResult<GetPermissionsTokensResult> | InvalidResult<HttpError>> {
  return ensurePod(hostname, async (pod) => {
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

    // Get pod permissions
    const permissionTokensStmt = podDb.prepare(
      `SELECT * FROM "permission_token" WHERE "expiry" > @expiry AND "max_redemptions" > "redemptions"`
    );
    const permissionTokens = permissionTokensStmt
      .all({ expiry: Date.now() })
      .map(permissionTokenMapper);

    const result: GetPermissionsTokensResult = {
      permissionTokens,
    };
    
    return new ValidResult(result);
  });
}
