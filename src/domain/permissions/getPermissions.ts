import * as db from "../../db/index.js";
import { IdentityPermission, JwtClaims } from "../../types/types.js";
import { Result } from "../../types/api.js";
import podPermissionMapper from "../../mappers/podPermission.js";
import logPermissionMapper from "../../mappers/logPermission.js";
import ensurePod from "../pods/util/ensurePod.js";
import { ACCESS_DENIED } from "../../errors/codes.js";
import { getPodDataDir } from "../../storage/index.js";
import getPodPermissionForJwt from "../pods/util/getPodPermissionForJwt.js";

export type GetPermissionsResult = {
  permissions: IdentityPermission[];
};

export default async function getPermissions(
  hostname: string,
  userClaims: JwtClaims
): Promise<Result<GetPermissionsResult>> {
  return ensurePod(hostname, async (pod) => {
    const podDataDir = getPodDataDir(pod.id);
    const podDb = db.getPodDb(podDataDir);

    const podPermission = await getPodPermissionForJwt(podDb, userClaims);

    if (podPermission.write) {
      const permissions: IdentityPermission[] = [];

      // Get pod permissions
      if (podPermission.write) {
        const podPermsStmt = podDb.prepare(`SELECT * FROM "pod_permissions"`);
        const podPermissionsInDb = podPermsStmt.all().map(podPermissionMapper);

        podPermissionsInDb
          .map((x) => ({
            identity: x.identity,
            pod: { access: x.access },
            logs: [],
          }))
          .forEach((x) => permissions.push(x));
      }

      // Get log permissions.
      const logPermsStmt = podDb.prepare(`SELECT * FROM "log_permissions"`);
      const logPermissionsInDb = logPermsStmt.all().map(logPermissionMapper);

      for (const logPermission of logPermissionsInDb) {
        const existing = permissions.find(
          (x) =>
            x.identity.iss === logPermission.identity.iss &&
            x.identity.sub === logPermission.identity.sub
        );
        if (existing) {
          existing.logs.push({
            log: logPermission.log,
            access: logPermission.access,
          });
        } else {
          permissions.push({
            identity: logPermission.identity,
            logs: [
              {
                log: logPermission.log,
                access: logPermission.access,
              },
            ],
          });
        }
      }

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
