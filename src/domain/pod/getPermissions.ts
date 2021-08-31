import * as db from "../../db/index.js";
import { JwtClaims, PodPermission } from "../../types/types.js";
import { Result } from "../../types/api.js";
import mapper from "../../mappers/podPermission.js";
import ensurePod from "./ensurePod.js";
import { ACCESS_DENIED } from "../../errors/codes.js";
import { getPodDataDir } from "../../storage/index.js";
import verifyAudClaim from "../../api/utils/verifyAudClaim.js";

export type GetPermissionsResult = {
  permissions: PodPermission[];
};

export default async function getPermissions(
  hostname: string,
  userClaims: JwtClaims | undefined
): Promise<Result<GetPermissionsResult>> {
  return ensurePod(hostname, async (pod) => {
    const podDataDir = getPodDataDir(pod.id);
    const podDb = db.getPodDb(podDataDir);

    if (
      userClaims &&
      pod.claims.iss === userClaims.iss &&
      pod.claims.sub === userClaims.sub &&
      verifyAudClaim(userClaims.aud, hostname)
    ) {
      // See if the permission already exists.
      const existingPermStmt = podDb.prepare(
        `SELECT * FROM "pod_permissions" WHERE "iss"=@iss AND "sub"="@sub`
      );

      const permissions = existingPermStmt
        .all({
          iss: userClaims.iss,
          sub: userClaims.sub,
        })
        .map(mapper);

      return {
        ok: true,
        value: { permissions },
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
