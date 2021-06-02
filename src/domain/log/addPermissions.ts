import * as config from "../../config";
import * as db from "../../db";
import { DomainResult as DomainResult } from "../../types/api";
import { MISSING_POD } from "../../errors/codes";
import { join } from "path";
import random from "../../utils/random";
import mkdirp = require("mkdirp");
import { getPodByHostname } from "../pod/getPodByHostname";
import { Permission } from "../../types/types";

export type AddPermissionsResult = {};

export type LogEntry = {
  data: string;
  encoding?: "utf-8";
  previousCommit?: string;
};

export default async function addPermissions(
  issuer: string,
  subject: string,
  hostname: string,
  log: string,
  permissions: Permission[] | undefined
): Promise<DomainResult<AddPermissionsResult>> {
  const appConfig = config.get();

  const pod = await getPodByHostname(issuer, subject, hostname);

  if (pod) {
    if (permissions) {
      // Let's see if the log already exists.
      const podDataDir = join(appConfig.storage.dataDir, pod.dataDir);
      const podDb = db.getPodDb(podDataDir);

      const insertPermissionsTx = podDb.transaction(
        (permissions: Permission[]) => {
          for (const permission of permissions) {
            // See if the permission already exists.
            const existingPermStmt = podDb.prepare(
              "SELECT * FROM permissions WHERE log=@log AND iss=@iss AND sub=@sub"
            );

            const existingItem = existingPermStmt.get();

            if (!existingItem) {
              const insertPermStmt = podDb.prepare(
                "INSERT INTO permissions (log, iss, sub, read, write, admin, metadata) VALUES (log, iss, sub, @read, @write, @admin, @metadata)"
              );

              insertPermStmt.run({
                log,
                iss: permission.claims.iss,
                sub: permission.claims.sub,
                read: permission.access.read ? 1 : 0,
                write: permission.access.write ? 1 : 0,
                admin: permission.access.admin ? 1 : 0,
                metadata: permission.access.metadata ? 1 : 0,
              });
            }
          }
        }
      );

      insertPermissionsTx.immediate(permissions);

      return {
        success: true,
      };
    } else {
      return {
        success: true,
      };
    }
  } else {
    return {
      success: false,
      code: MISSING_POD,
      error: "Pod not found.",
    };
  }
}

function generateLogId() {
  return random(8);
}
