import Sqlite3 from "better-sqlite3";

import { Identity, PodAccess } from "../../../types/types.js";
import { PodAccessRow, PodPermissionsRow } from "../../../types/db.js";
import {
  generateInsertStatement,
  generateUpdateStatement,
} from "../../../lib/sqlite.js";

export default async function addPodPermission(
  identity: Identity,
  access: PodAccess,
  podDb: Sqlite3.Database
): Promise<void> {
  const existingPermStmt = podDb.prepare(
    `SELECT * FROM "pod_permissions" WHERE "iss"=@iss AND "sub"=@sub`
  );

  const existingItem = existingPermStmt.get({
    iss: identity.iss,
    sub: identity.sub,
  });

  if (!existingItem) {
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
    const podPermissionsRow: PodAccessRow = {
      admin: access.admin ? 1 : 0,
      write: access.write ? 1 : 0,
      read: access.read ? 1 : 0,
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
