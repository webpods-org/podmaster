import Sqlite3 from "better-sqlite3";

import { PodJwtClaims, PodAccess, PodPermission } from "../../../types/index.js";
import permissionMapper from "../../../mappers/podPermission.js";
import hasScope from "../../../lib/jwt/hasScope.js";

const noAccess: PodAccess = {
  read: false,
  write: false,
};

export default async function getPodPermissionForJwt(
  app: string,
  podDb: Sqlite3.Database,
  userClaims: PodJwtClaims
): Promise<PodAccess> {
  // See if the permission already exists.
  const existingPermStmt = podDb.prepare(`SELECT * FROM "pod_permission"`);
  const permissions = existingPermStmt.all().map(permissionMapper);

  const matchingPerm = permissions.find(
    (x) =>
      x.identity.iss === userClaims.iss && x.identity.sub === userClaims.sub
  );

  if (!matchingPerm) {
    return noAccess;
  }
  
  return {
    ...matchingPerm.access,
    write:
      matchingPerm.access.write && hasScope(userClaims.scope, app, "write"),
    read: matchingPerm.access.read && hasScope(userClaims.scope, app, "read"),
  };
}
