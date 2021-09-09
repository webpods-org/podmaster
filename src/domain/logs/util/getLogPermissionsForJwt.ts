import Sqlite3 from "better-sqlite3";

import permissionMapper from "../../../mappers/logPermission.js";
import logMapper from "../../../mappers/log.js";
import { JwtClaims } from "../../../types/types.js";

const noPermissions = {
  read: false,
  write: false,
  publish: false,
  subscribe: false,
};

export async function getLogPermissionsForJwt(
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

  if (logInfo) {
    if (userClaims) {
      // See if the permission already exists.
      const existingPermStmt = podDb.prepare(
        `SELECT * FROM "log_permissions" WHERE "log_id"=@log_id AND "iss"=@iss AND ("sub"=@sub OR "sub"='*')`
      );

      const permissions = existingPermStmt
        .all({ log_id: name, iss: userClaims.iss, sub: userClaims.sub })
        .map(permissionMapper);

      const permission = permissions.length ? permissions[0] : undefined;

      if (permission) {
        return {
          ...permission.access,
          read: permission.access.read || logInfo.public,
          subscribe: permission.access.subscribe || logInfo.public,
        };
      } else {
        return {
          ...noPermissions,
          read: logInfo.public,
        };
      }
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
