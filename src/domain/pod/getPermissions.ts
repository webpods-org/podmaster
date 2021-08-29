import * as db from "../../db/index.js";
import { PodPermission } from "../../types/types.js";
import { Result } from "../../types/api.js";
import mapper from "../../mappers/podPermission.js";
import ensurePod from "./ensurePod.js";
import { ACCESS_DENIED } from "../../errors/codes.js";
import { getPodDataDir } from "../../storage/index.js";

export type GetPermissionsResult = {
  permissions: PodPermission[];
};

export default async function getPermissions(
  iss: string,
  sub: string,
  hostname: string
): Promise<Result<GetPermissionsResult>> {
  return ensurePod(hostname, async (pod) => {
    const podDataDir = getPodDataDir(pod.name);
    const podDb = db.getPodDb(podDataDir);

    // Is own pod?
    if (pod.claims.iss === iss && pod.claims.sub === sub) {
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
