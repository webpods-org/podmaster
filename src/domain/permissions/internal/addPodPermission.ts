import Sqlite3 from "better-sqlite3";

import { Identity, PodAccess } from "../../../types/index.js";
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
    `SELECT * FROM "pod_permission" WHERE "iss"=@iss AND "sub"=@sub`
  );

  const existingRow = existingPermStmt.get({
    iss: identity.iss,
    sub: identity.sub,
  });

  if (!existingRow) {
    const podPermissionsRow: PodPermissionsRow = {
      iss: identity.iss,
      sub: identity.sub,
      write: access.write ? 1 : 0,
      read: access.read ? 1 : 0,
      created_at: Date.now(),
    };

    const insertPermStmt = podDb.prepare(
      generateInsertStatement<PodPermissionsRow>(
        "pod_permission",
        podPermissionsRow
      )
    );

    insertPermStmt.run(podPermissionsRow);
  } else {
    const existingPodPermission = podPermissionMapper(existingRow);

    const podPermissionsRow: PodAccessRow = {
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
        "pod_permission",
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
