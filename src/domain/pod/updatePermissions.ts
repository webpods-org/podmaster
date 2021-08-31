import * as db from "../../db/index.js";
import { JwtClaims, PodPermission } from "../../types/types.js";
import { Result } from "../../types/api.js";
import ensurePod from "./ensurePod.js";
import { ACCESS_DENIED } from "../../errors/codes.js";
import { PodPermissionsRow } from "../../types/db.js";
import { generateInsertStatement } from "../../lib/sqlite.js";
import { getPodDataDir } from "../../storage/index.js";
import { getPodPermissionsForJwt } from "./getPodPermissionsForJwt.js";

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
  hostname: string,
  {
    add,
    remove,
  }: {
    add: PodPermission[];
    remove: { claims: { iss: string; sub: string } }[];
  },
  userClaims: JwtClaims
): Promise<Result<UpdatePermissionsResult>> {
  return ensurePod(hostname, async (pod) => {
    // Let's see if the log already exists.
    const podDataDir = getPodDataDir(pod.id);
    const podDb = db.getPodDb(podDataDir);

    const permissionsResult = await getPodPermissionsForJwt(podDb, userClaims);

    if (permissionsResult.write) {
      if (remove) {
        for (const item of remove) {
          // See if the permission already exists.
          const deletePermStmt = podDb.prepare(
            `DELETE FROM "pod_permissions" WHERE "iss"=@iss AND "sub"=@sub`
          );

          deletePermStmt.get({
            iss: item.claims.iss,
            sub: item.claims.sub,
          });
        }
      }

      if (add) {
        for (const permission of add) {
          // See if the permission already exists.
          const existingPermStmt = podDb.prepare(
            `SELECT * FROM "pod_permissions" WHERE "iss"=@iss AND "sub"=@sub`
          );

          const existingItem = existingPermStmt.get({
            iss: permission.claims.iss,
            sub: permission.claims.sub,
          });

          // Don't insert if it already exists.
          if (!existingItem) {
            const permissionsRow: PodPermissionsRow = {
              iss: permission.claims.iss,
              sub: permission.claims.sub,
              admin: permission.access.admin ? 1 : 0,
              read: permission.access.read ? 1 : 0,
              write: permission.access.write ? 1 : 0,
              created_at: Date.now(),
            };

            const insertPermStmt = podDb.prepare(
              generateInsertStatement("pod_permissions", permissionsRow)
            );

            insertPermStmt.run(permissionsRow);
          }
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
