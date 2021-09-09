import Sqlite3 from "better-sqlite3";

import { Identity, PodAccess } from "../../../types/types.js";
import { PodAccessRow, PodPermissionsRow } from "../../../types/db.js";
import {
  generateInsertStatement,
  generateUpdateStatement,
} from "../../../lib/sqlite.js";
import podPermissionMapper from "../../../mappers/podPermission.js";

export default async function addPodPermission(
  identity: Identity,
  access: PodAccess,
  appendPermissions: boolean,
  podDb: Sqlite3.Database
): Promise<void> {
  const existingPermStmt = podDb.prepare(
    `SELECT * FROM "pod_permissions" WHERE "iss"=@iss AND "sub"=@sub`
  );

  const existingRow = existingPermStmt.get({
    iss: identity.iss,
    sub: identity.sub,
  });

  if (!existingRow) {
    const podPermissionsRow: PodPermissionsRow = {
      iss: identity.iss,
      sub: identity.sub,
      admin: access.admin ? 1 : 0,
      write: access.write ? 1 : 0,
      read: access.read ? 1 : 0,
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
    const existingPodPermission = podPermissionMapper(existingRow);

    const podPermissionsRow: PodAccessRow = {
      admin: (
        appendPermissions
          ? existingPodPermission.access.admin || access.admin
          : access.admin
      )
        ? 1
        : 0,
      write: (
        appendPermissions
          ? existingPodPermission.access.write || access.write
          : access.write
      )
        ? 1
        : 0,
      read: (
        appendPermissions
          ? existingPodPermission.access.read || access.read
          : access.read
      )
        ? 1
        : 0,
    };

    const updatePermStatement = podDb.prepare(
      generateUpdateStatement<PodPermissionsRow>(
        "pod_permissions",
        podPermissionsRow,
        `WHERE "iss"=@iss AND "sub"=@sub`
      )
    );

    updatePermStatement.run({
      ...podPermissionsRow,
      iss: identity.iss,
      sub: identity.sub,
    });
  }
}
