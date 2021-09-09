import Sqlite3 from "better-sqlite3";

import { Identity, LogAccess } from "../../../types/types.js";
import { LogAccessRow, LogPermissionsRow } from "../../../types/db.js";
import {
  generateInsertStatement,
  generateUpdateStatement,
} from "../../../lib/sqlite.js";

export default async function addLogPermission(
  log: string,
  identity: Identity,
  access: LogAccess,
  podDb: Sqlite3.Database
): Promise<void> {
  const existingPermStmt = podDb.prepare(
    `SELECT * FROM "log_permissions" WHERE "iss"=@iss AND "sub"=@sub AND "log_id"=@log_id`
  );

  const existingItem = existingPermStmt.get({
    iss: identity.iss,
    sub: identity.sub,
    log_id: log,
  });

  if (!existingItem) {
    const permissionsRow: LogPermissionsRow = {
      log_id: log,
      iss: identity.iss,
      sub: identity.sub,
      read: access.read ? 1 : 0,
      write: access.write ? 1 : 0,
      publish: access.publish ? 1 : 0,
      subscribe: access.subscribe ? 1 : 0,
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
    const permissionsRow: LogAccessRow = {
      read: access.read ? 1 : 0,
      write: access.write ? 1 : 0,
      publish: access.publish ? 1 : 0,
      subscribe: access.subscribe ? 1 : 0,
    };

    const updatePermStmt = podDb.prepare(
      generateUpdateStatement<LogPermissionsRow>(
        "log_permissions",
        permissionsRow,
        `WHERE "iss"=@iss AND "sub"=@sub AND "log_id"=@log_id`
      )
    );

    updatePermStmt.run({
      ...permissionsRow,
      log_id: log,
      iss: identity.iss,
      sub: identity.sub,
    });
  }
}
