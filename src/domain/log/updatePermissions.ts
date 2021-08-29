import * as db from "../../db/index.js";
import { LogPermission } from "../../types/types.js";
import { Result } from "../../types/api.js";
import ensurePod from "../pod/ensurePod.js";
import { ACCESS_DENIED } from "../../errors/codes.js";
import { LogPermissionsRow } from "../../types/db.js";
import { generateInsertStatement } from "../../lib/sqlite.js";
import { getPodDataDir } from "../../storage/index.js";

export type UpdatePermissionsResult = {
  added: number;
  removed: number;
};

export type LogEntry = {
  data: string;
  encoding?: "utf-8";
  previousCommit?: string;
};

export default async function updatePermissions(
  iss: string,
  sub: string,
  hostname: string,
  logName: string,
  {
    add,
    remove,
  }: { add: LogPermission[]; remove: { claims: { iss: string; sub: string } }[] }
): Promise<Result<UpdatePermissionsResult>> {
  return ensurePod(hostname, async (pod) => {
    // Let's see if the log already exists.
    const podDataDir = getPodDataDir(pod.name);
    const podDb = db.getPodDb(podDataDir);

    if (pod.claims.iss === iss && pod.claims.sub === sub) {
      if (add) {
        for (const permission of add) {
          // See if the permission already exists.
          const existingPermStmt = podDb.prepare(
            `SELECT * FROM "log_permissions" WHERE "log_name"=@log_name AND "iss"=@iss AND "sub"=@sub`
          );

          const existingItem = existingPermStmt.get({
            log_name: logName,
            iss: permission.claims.iss,
            sub: permission.claims.sub,
          });

          // Don't insert if it already exists.
          if (!existingItem) {
            const permissionsRow: LogPermissionsRow = {
              log_name: logName,
              iss: permission.claims.iss,
              sub: permission.claims.sub,
              read: permission.access.read ? 1 : 0,
              write: permission.access.write ? 1 : 0,
              publish: permission.access.publish ? 1 : 0,
              subscribe: permission.access.subscribe ? 1 : 0,
              created_at: Date.now(),
            };

            const insertPermStmt = podDb.prepare(
              generateInsertStatement("log_permissions", permissionsRow)
            );

            insertPermStmt.run(permissionsRow);
          }
        }
      }

      if (remove) {
        for (const item of remove) {
          // See if the permission already exists.
          const deletePermStmt = podDb.prepare(
            `DELETE FROM "log_permissions" WHERE "log_name"=@log_name AND "iss"=@iss AND "sub"=@sub`
          );

          deletePermStmt.get({
            log_name: logName,
            iss: item.claims.iss,
            sub: item.claims.sub,
          });
        }
      }

      return {
        ok: true,
        value: {
          added: add ? add.length : 0,
          removed: remove ? remove.length : 0,
        },
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
