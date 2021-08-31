import * as db from "../../db/index.js";
import { JwtClaims, LogPermission } from "../../types/types.js";
import { Result } from "../../types/api.js";
import mapper from "../../mappers/logPermission.js";
import ensurePod from "../pod/ensurePod.js";
import { ACCESS_DENIED } from "../../errors/codes.js";
import { getPodDataDir } from "../../storage/index.js";
import { getPodPermissionsForJwt } from "../pod/getPodPermissionsForJwt.js";

export type GetPermissionsResult = {
  permissions: LogPermission[];
};

export default async function getPermissions(
  hostname: string,
  logId: string,
  userClaims: JwtClaims
): Promise<Result<GetPermissionsResult>> {
  return ensurePod(hostname, async (pod) => {
    const podDataDir = getPodDataDir(pod.id);
    const podDb = db.getPodDb(podDataDir);

    // Is own pod?
    const podPermissions = await getPodPermissionsForJwt(podDb, userClaims);
    if (podPermissions.read) {
      // See if the permission already exists.
      const existingPermStmt = podDb.prepare(
        `SELECT * FROM "log_permissions" WHERE "log_id"=@log_id`
      );

      const permissions = existingPermStmt.all({ log_id: logId }).map(mapper);

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
