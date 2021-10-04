import Sqlite3 from "better-sqlite3";

import permissionMapper from "../../../mappers/logPermission.js";
import logMapper from "../../../mappers/log.js";
import { PodJwtClaims, LogAccess } from "../../../types/index.js";
import hasScope from "../../../lib/jwt/hasScope.js";

const noAccess: LogAccess = {
  read: false,
  write: false,
  publish: false,
  subscribe: false,
};

export default async function getLogPermissionForJwt(
  app: string,
  name: string,
  podDb: Sqlite3.Database,
  userClaims: PodJwtClaims | undefined
): Promise<LogAccess> {
  const getLogStmt = podDb.prepare(`SELECT * from "log" WHERE "id"=@name`);
  const logInfoRow = getLogStmt.get({ name });
  const logInfo = logInfoRow ? logMapper(logInfoRow) : undefined;

  if (!logInfo) {
    return noAccess;
  }

  if (!userClaims) {
    return {
      ...noAccess,
      read: logInfo.public,
    };
  }

  // See if the permission already exists.
  const existingPermStmt = podDb.prepare(
    `SELECT * FROM "log_permission" WHERE "log_id"=@log_id AND "iss"=@iss AND ("sub"=@sub OR "sub"='*')`
  );

  const logPermissionsInDb = existingPermStmt
    .all({ log_id: name, iss: userClaims.iss, sub: userClaims.sub })
    .map(permissionMapper);

  const logPermission = logPermissionsInDb.length
    ? logPermissionsInDb[0]
    : undefined;

  if (!logPermission) {
    return {
      ...noAccess,
      read: logInfo.public,
    };
  }
  
  return {
    write:
      (logPermission.access.write &&
        hasScope(userClaims.scope, app, "write")) ||
      logInfo.public,
    read:
      (logPermission.access.read && hasScope(userClaims.scope, app, "read")) ||
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
}
