import * as db from "../../db/index.js";
import { JwtClaims, PodPermission } from "../../types/types.js";
import { Result } from "../../types/api.js";
import mapper from "../../mappers/podPermission.js";
import ensurePod from "./ensurePod.js";
import { ACCESS_DENIED } from "../../errors/codes.js";
import { getPodDataDir } from "../../storage/index.js";
import { getPodPermissionsForJwt } from "./getPodPermissionsForJwt.js";

export type GetPermissionsResult = {
  permissions: PodPermission[];
};

export default async function getPermissions(
  hostname: string,
  userClaims: JwtClaims
): Promise<Result<GetPermissionsResult>> {
  return ensurePod(hostname, async (pod) => {
    const podDataDir = getPodDataDir(pod.id);
    const podDb = db.getPodDb(podDataDir);

    const podPermissions = await getPodPermissionsForJwt(podDb, userClaims);

    if (podPermissions.read) {
      // See if the permission already exists.
      const existingPermStmt = podDb.prepare(`SELECT * FROM "pod_permissions"`);
      const permissions = existingPermStmt.all().map(mapper);

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
