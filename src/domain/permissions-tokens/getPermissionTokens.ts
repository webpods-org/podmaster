import * as db from "../../db/index.js";
import {
  IdentityPermission,
  JwtClaims,
} from "../../types/types.js";
import { Result } from "../../types/api.js";
import podPermissionMapper from "../../mappers/podPermission.js";
import logPermissionMapper from "../../mappers/logPermission.js";
import ensurePod from "../pods/ensurePod.js";
import { ACCESS_DENIED } from "../../errors/codes.js";
import { getPodDataDir } from "../../storage/index.js";
import { getPodPermissionsForJwt } from "../pods/getPodPermissionsForJwt.js";

export type GetPermissionsTokensResult = {
  permissions: IdentityPermission[];
};

export default async function getPermissionTokens(
  hostname: string,
  userClaims: JwtClaims
): Promise<Result<GetPermissionsTokensResult>> {
  return ensurePod(hostname, async (pod) => {
    const podDataDir = getPodDataDir(pod.id);
    const podDb = db.getPodDb(podDataDir);

    const podPermissions = await getPodPermissionsForJwt(podDb, userClaims);

    if (podPermissions.read) {
      // Get pod permissions
      const podPermsStmt = podDb.prepare(`SELECT * FROM "pod_permissions"`);
      const podPermissions = podPermsStmt.all().map(podPermissionMapper);

      const permissions: IdentityPermission[] = podPermissions.map((x) => ({
        identity: x.identity,
        pod: { access: x.access },
        logs: [],
      }));

      // Get log permissions.
      const logPermsStmt = podDb.prepare(`SELECT * FROM "log_permissions"`);
      const logPermissions = logPermsStmt.all().map(logPermissionMapper);

      for (const logPermission of logPermissions) {
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
