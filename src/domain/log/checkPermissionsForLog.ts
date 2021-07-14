import { PodInfo } from "../../types/types";
import permissionMapper from "../../mappers/permission";
import logMapper from "../../mappers/log";
import Sqlite3 = require("better-sqlite3");

const noPermissions = {
  read: false,
  write: false,
  admin: false,
  metadata: false,
  publish: false,
  subscribe: false,
};

export async function getPermissionsForLog(
  pod: PodInfo,
  iss: string | undefined,
  sub: string | undefined,
  log: string,
  podDb: Sqlite3.Database
): Promise<{
  read: boolean;
  write: boolean;
  admin: boolean;
  metadata: boolean;
  publish: boolean;
  subscribe: boolean;
}> {
  const isOwnPod = pod.claims.iss === iss && pod.claims.sub === sub;

  if (isOwnPod) {
    return {
      read: true,
      write: true,
      admin: true,
      metadata: true,
      publish: true,
      subscribe: true,
    };
  } else {
    const getLogStmt = podDb.prepare(`SELECT * from "logs" WHERE "log"=@log`);
    const logInfoRow = getLogStmt.get({ log });
    const logInfo = logInfoRow ? logMapper(logInfoRow) : undefined;

    if (logInfo) {
      // See if the permission already exists.
      const existingPermStmt = podDb.prepare(
        `SELECT * FROM "permissions" WHERE "log"=@log`
      );

      const permissions = existingPermStmt.all({ log }).map(permissionMapper);

      const matchingPerm = permissions.find(
        (x) =>
          x.claims.iss === iss && (x.claims.sub === sub || x.claims.sub === "*")
      );

      if (matchingPerm) {
        return {
          ...matchingPerm.access,
          read: matchingPerm.access.read || logInfo.public,
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
}
