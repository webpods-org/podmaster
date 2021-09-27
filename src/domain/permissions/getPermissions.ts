import * as db from "../../db/index.js";
import { IdentityPermission, JwtClaims } from "../../types/index.js";
import podPermissionMapper from "../../mappers/podPermission.js";
import logPermissionMapper from "../../mappers/logPermission.js";
import ensurePod from "../pods/internal/ensurePod.js";
import { getPodDataDir } from "../../storage/index.js";
import getPodPermissionForJwt from "../pods/internal/getPodPermissionForJwt.js";
import { StatusCodes } from "http-status-codes";
import { InvalidResult, ValidResult } from "../../Result.js";
import { HttpError } from "../../utils/http.js";

export type GetPermissionsResult = {
  permissions: IdentityPermission[];
};

export default async function getPermissions(
  hostname: string,
  userClaims: JwtClaims
): Promise<ValidResult<GetPermissionsResult> | InvalidResult<HttpError>> {
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

    const result: GetPermissionsResult = { permissions };
    return new ValidResult(result);
  });
}
