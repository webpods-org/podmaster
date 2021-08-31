import Sqlite3 from "better-sqlite3";

import permissionMapper from "../../mappers/logPermission.js";
import logMapper from "../../mappers/log.js";
import { JwtClaims } from "../../types/types.js";
import verifyAudClaim from "../../api/utils/verifyAudClaim.js";

const noPermissions = {
  read: false,
  write: false,
  publish: false,
  subscribe: false,
};

export async function getPermissionsForLog(
  hostname: string,
  name: string,
  podDb: Sqlite3.Database,
  userClaims: JwtClaims | undefined
): Promise<{
  read: boolean;
  write: boolean;
  publish: boolean;
  subscribe: boolean;
}> {
  const getLogStmt = podDb.prepare(`SELECT * from "logs" WHERE "id"=@name`);
  const logInfoRow = getLogStmt.get({ name });
  const logInfo = logInfoRow ? logMapper(logInfoRow) : undefined;

  if (userClaims && logInfo) {
    // See if the permission already exists.
    const existingPermStmt = podDb.prepare(
      `SELECT * FROM "log_permissions" WHERE "log_id"=@log_id`
    );

    const permissions = existingPermStmt
      .all({ log_id: name })
      .map(permissionMapper);

    const matchingPerm = permissions.find(
      (x) =>
        x.claims.iss === userClaims.iss &&
        (x.claims.sub === userClaims.sub || x.claims.sub === "*") &&
        verifyAudClaim(userClaims.aud, hostname)
    );

    if (matchingPerm) {
      return {
        ...matchingPerm.access,
        read: matchingPerm.access.read || logInfo.public,
        subscribe: matchingPerm.access.subscribe || logInfo.public,
      };
    } else {
      return {
        ...noPermissions,
        read: logInfo.public,
      };
    }
  } else {
    return noPermissions;
  }
}
