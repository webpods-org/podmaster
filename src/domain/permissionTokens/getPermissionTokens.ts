import * as db from "../../db/index.js";
import { JwtClaims, PermissionToken } from "../../types/types.js";
import { Result } from "../../types/api.js";
import permissionTokenMapper from "../../mappers/permissionToken.js";
import ensurePod from "../pods/util/ensurePod.js";
import { ACCESS_DENIED } from "../../errors/codes.js";
import { getPodDataDir } from "../../storage/index.js";
import getPodPermissionForJwt from "../pods/util/getPodPermissionForJwt.js";

export type GetPermissionsTokensResult = {
  permissionTokens: PermissionToken[];
};

export default async function getPermissionTokens(
  hostname: string,
  userClaims: JwtClaims
): Promise<Result<GetPermissionsTokensResult>> {
  return ensurePod(hostname, async (pod) => {
    const podDataDir = getPodDataDir(pod.id);
    const podDb = db.getPodDb(podDataDir);

    const podPermission = await getPodPermissionForJwt(pod.app, podDb, userClaims);

    if (podPermission.write) {
      // Get pod permissions
      const permissionTokensStmt = podDb.prepare(
        `SELECT * FROM "permission_tokens" WHERE "expiry" > @expiry AND "max_redemptions" > "redemptions"`
      );
      const permissionTokens = permissionTokensStmt
        .all({ expiry: Date.now() })
        .map(permissionTokenMapper);

      return {
        ok: true,
        value: { permissionTokens },
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
