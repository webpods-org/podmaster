import * as config from "../../config";
import * as db from "../../db";
import { MISSING_POD } from "../../errors/codes";
import { join } from "path";
import random from "../../utils/random";
import { getPodByHostname } from "../pod/getPodByHostname";
import { Permission } from "../../types/types";
import { Result } from "../../types/api";
import ensurePod from "./ensurePod";

export type AddPermissionResult = {
  added: boolean;
};

export type LogEntry = {
  data: string;
  encoding?: "utf-8";
  previousCommit?: string;
};

export default async function addPermission(
  issuer: string,
  subject: string,
  hostname: string,
  log: string,
  permission: Permission
): Promise<Result<AddPermissionResult>> {
  const appConfig = config.get();
  
  return ensurePod(issuer, subject, hostname, async (pod) => {
    // Let's see if the log already exists.
    const podDataDir = join(appConfig.storage.dataDir, pod.dataDir);
    const podDb = db.getPodDb(podDataDir);

    // See if the permission already exists.
    const existingPermStmt = podDb.prepare(
      "SELECT * FROM permissions WHERE log=@log AND iss=@iss AND sub=@sub"
    );

    const existingItem = existingPermStmt.get({
      log,
      iss: permission.claims.iss,
      sub: permission.claims.sub,
    });

    // Don't insert if it already exists.
    if (!existingItem) {
      const insertPermStmt = podDb.prepare(
        "INSERT INTO permissions (log, iss, sub, read, write, admin, metadata, created_at) VALUES (@log, @iss, @sub, @read, @write, @admin, @metadata, @created_at)"
      );

      insertPermStmt.run({
        log,
        iss: permission.claims.iss,
        sub: permission.claims.sub,
        read: permission.access.read ? 1 : 0,
        write: permission.access.write ? 1 : 0,
        admin: permission.access.admin ? 1 : 0,
        metadata: permission.access.metadata ? 1 : 0,
        created_at: Date.now(),
      });

      return {
        ok: true,
        added: true,
      };
    } else {
      return {
        ok: true,
        added: false,
      };
    }
  });
}

function generateLogId() {
  return random(8);
}
