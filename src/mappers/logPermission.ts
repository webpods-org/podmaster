import { LogPermission } from "../types/types.js";
import { LogPermissionsRow } from "../types/db.js";

export default function map(row: LogPermissionsRow): LogPermission {
  return {
    claims: {
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
