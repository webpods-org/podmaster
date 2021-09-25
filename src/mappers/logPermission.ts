import { LogPermission } from "../types/index.js";
import { LogPermissionsRow } from "../types/db.js";

export default function map(row: LogPermissionsRow): LogPermission {
  return {
    log: row.log_id,
    identity: {
      iss: row.iss,
      sub: row.sub,
    },
    access: {
      read: row.read === 1,
      write: row.write === 1,
      publish: row.publish === 1,
      subscribe: row.subscribe === 1,
    },
  };
}
