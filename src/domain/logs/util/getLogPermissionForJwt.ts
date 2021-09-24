import Sqlite3 from "better-sqlite3";

import permissionMapper from "../../../mappers/logPermission.js";
import logMapper from "../../../mappers/log.js";
import { JwtClaims } from "../../../types/types.js";
import hasScope from "../../../lib/jwt/hasScope.js";

const noAccess = {
  read: false,
  write: false,
  publish: false,
  subscribe: false,
};

export default async function getLogPermissionForJwt(
  app: string,
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

      const logPermissionsInDb = existingPermStmt
        .all({ log_id: name, iss: userClaims.iss, sub: userClaims.sub })
        .map(permissionMapper);

      const logPermission = logPermissionsInDb.length
        ? logPermissionsInDb[0]
        : undefined;

      if (logPermission) {
        return {
          write:
            (logPermission.access.write &&
              hasScope(userClaims.scope, app, "write")) ||
            logInfo.public,
          read:
            (logPermission.access.read &&
              hasScope(userClaims.scope, app, "read")) ||
            logInfo.public,
          publish:
            (logPermission.access.read &&
              (hasScope(userClaims.scope, app, "read") ||
                hasScope(userClaims.scope, app, "write"))) ||
            logInfo.public,
          subscribe:
            (logPermission.access.subscribe &&
              (hasScope(userClaims.scope, app, "read") ||
                hasScope(userClaims.scope, app, "write"))) ||
            logInfo.public,
        };
      } else {
        return {
          ...noAccess,
          read: logInfo.public,
        };
      }
    } else {
      return {
        ...noAccess,
        read: logInfo.public,
      };
    }
  } else {
    return noAccess;
  }
}
