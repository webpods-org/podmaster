import * as db from "../../db/index.js";
import { JwtClaims, PermissionToken } from "../../types/index.js";
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
) {
  return ensurePod(hostname, async (pod) => {
    const podDataDir = getPodDataDir(pod.id);
    const podDb = db.getPodDb(podDataDir);

    const podPermission = await getPodPermissionForJwt(
      pod.app,
      podDb,
      userClaims
    );

    if (podPermission.write) {
      // Get pod permissions
      const permissionTokensStmt = podDb.prepare(
        `SELECT * FROM "permission_tokens" WHERE "expiry" > @expiry AND "max_redemptions" > "redemptions"`
      );
      const permissionTokens = permissionTokensStmt
        .all({ expiry: Date.now() })
        .map(permissionTokenMapper);

      return new ValidResult({
        permissionTokens,
      });
    } else {
      return new InvalidResult({
        error: "Access denied.",
        status: StatusCodes.UNAUTHORIZED,
      });
    }
  });
}
