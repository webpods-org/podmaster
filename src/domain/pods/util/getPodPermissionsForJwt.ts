import Sqlite3 from "better-sqlite3";

import { JwtClaims } from "../../../types/types.js";
import permissionMapper from "../../../mappers/podPermission.js";

const noPermissions = {
  admin: false,
  read: false,
  write: false,
};

export default async function getPodPermissionsForJwt(
  podDb: Sqlite3.Database,
  userClaims: JwtClaims
): Promise<{
  admin: boolean;
  read: boolean;
  write: boolean;
}> {
  // See if the permission already exists.
  const existingPermStmt = podDb.prepare(`SELECT * FROM "pod_permissions"`);
  const permissions = existingPermStmt.all().map(permissionMapper);

  const matchingPerm = permissions.find(
    (x) => x.identity.iss === userClaims.iss && x.identity.sub === userClaims.sub
  );

  if (matchingPerm) {
    return {
      ...matchingPerm.access,
      write: matchingPerm.access.admin || matchingPerm.access.write,
      read: matchingPerm.access.admin || matchingPerm.access.read,
    };
  } else {
    return noPermissions;
  }
}
