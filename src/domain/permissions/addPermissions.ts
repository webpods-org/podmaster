import * as db from "../../db/index.js";
import {
  Identity,
  JwtClaims,
  LogAccess,
  PodAccess,
  PodPermission,
} from "../../types/types.js";
import { Result } from "../../types/api.js";
import ensurePod from "../pods/ensurePod.js";
import { ACCESS_DENIED } from "../../errors/codes.js";
import { LogPermissionsRow, PodPermissionsRow } from "../../types/db.js";
import {
  generateInsertStatement,
  generateUpdateStatement,
} from "../../lib/sqlite.js";
import { getPodDataDir } from "../../storage/index.js";
import { getPodPermissionsForJwt } from "../pods/getPodPermissionsForJwt.js";

export type UpdatePermissionsResult = {};

export type LogEntry = {
  data: string;
  encoding?: "utf-8";
  previousCommit?: string;
};

export default async function addPermissions(
  hostname: string,
  permissions: {
    identity: Identity;
    pod?: {
      access: PodAccess;
    };
    logs?: {
      log: string;
      access: LogAccess;
    }[];
  },
  userClaims: JwtClaims
): Promise<Result<UpdatePermissionsResult>> {
  return ensurePod(hostname, async (pod) => {
    // Let's see if the log already exists.
    const podDataDir = getPodDataDir(pod.id);
    const podDb = db.getPodDb(podDataDir);

    const podPermissions = await getPodPermissionsForJwt(podDb, userClaims);

    if (podPermissions.write) {
      if (permissions.pod) {
        const existingPermStmt = podDb.prepare(
          `SELECT * FROM "pod_permissions" WHERE "iss"=@iss AND "sub"=@sub`
        );

        const existingItem = existingPermStmt.get({
          iss: permissions.identity.iss,
          sub: permissions.identity.sub,
        });

        if (!existingItem) {
          const podPermissionsRow: PodPermissionsRow = {
            iss: permissions.identity.iss,
            sub: permissions.identity.sub,
            admin: permissions.pod.access.admin ? 1 : 0,
            write: permissions.pod.access.write ? 1 : 0,
            read: permissions.pod.access.read ? 1 : 0,
            created_at: Date.now(),
          };

          const insertPermStmt = podDb.prepare(
            generateInsertStatement<PodPermissionsRow>(
              "pod_permissions",
              podPermissionsRow
            )
          );

          insertPermStmt.run(podPermissionsRow);
        } else {
          const podPermissionsRow: Omit<PodPermissionsRow, "created_at"> = {
            iss: permissions.identity.iss,
            sub: permissions.identity.sub,
            admin: permissions.pod.access.admin ? 1 : 0,
            write: permissions.pod.access.write ? 1 : 0,
            read: permissions.pod.access.read ? 1 : 0,
          };

          const updatePermStatement = podDb.prepare(
            generateUpdateStatement<PodPermissionsRow>(
              "pod_permissions",
              { ...podPermissionsRow },
              `WHERE "iss"=@iss AND "sub"=@sub`
            )
          );

          updatePermStatement.run(podPermissionsRow);
        }
      }

      if (permissions.logs) {
        for (const logPermission of permissions.logs) {
          const existingPermStmt = podDb.prepare(
            `SELECT * FROM "log_permissions" WHERE "iss"=@iss AND "sub"=@sub AND "log_id"=@log_id`
          );

          const existingItem = existingPermStmt.get({
            iss: permissions.identity.iss,
            sub: permissions.identity.sub,
            log_id: logPermission.log,
          });

          if (!existingItem) {
            const permissionsRow: LogPermissionsRow = {
              log_id: logPermission.log,
              iss: permissions.identity.iss,
              sub: permissions.identity.sub,
              read: logPermission.access.read ? 1 : 0,
              write: logPermission.access.write ? 1 : 0,
              publish: logPermission.access.publish ? 1 : 0,
              subscribe: logPermission.access.subscribe ? 1 : 0,
              created_at: Date.now(),
            };

            const insertPermStmt = podDb.prepare(
              generateInsertStatement<LogPermissionsRow>(
                "log_permissions",
                permissionsRow
              )
            );

            insertPermStmt.run(permissionsRow);
          } else {
            const permissionsRow: Omit<LogPermissionsRow, "created_at"> = {
              log_id: logPermission.log,
              iss: permissions.identity.iss,
              sub: permissions.identity.sub,
              read: logPermission.access.read ? 1 : 0,
              write: logPermission.access.write ? 1 : 0,
              publish: logPermission.access.publish ? 1 : 0,
              subscribe: logPermission.access.subscribe ? 1 : 0,
            };

            const updatePermStmt = podDb.prepare(
              generateUpdateStatement<LogPermissionsRow>(
                "log_permissions",
                permissionsRow,
                `WHERE "iss"=@iss AND "sub"=@sub AND "log_id"=@log_id`
              )
            );

            updatePermStmt.run(permissionsRow);
          }
        }
      }

      return {
        ok: true,
        value: {},
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
