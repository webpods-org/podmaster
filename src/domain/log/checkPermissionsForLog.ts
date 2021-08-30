import Sqlite3 from "better-sqlite3";

import permissionMapper from "../../mappers/logPermission.js";
import logMapper from "../../mappers/log.js";

const noPermissions = {
  read: false,
  write: false,
  publish: false,
  subscribe: false,
};

export async function getPermissionsForLog(
  iss: string | undefined,
  sub: string | undefined,
  name: string,
  podDb: Sqlite3.Database
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
    // See if the permission already exists.
    const existingPermStmt = podDb.prepare(
      `SELECT * FROM "log_permissions" WHERE "log_id"=@log_id`
    );

    const permissions = existingPermStmt
      .all({ log_id: name })
      .map(permissionMapper);

    const matchingPerm = permissions.find(
      (x) =>
        x.claims.iss === iss && (x.claims.sub === sub || x.claims.sub === "*")
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
