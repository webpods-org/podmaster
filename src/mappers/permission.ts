import { Permission } from "../types/types.js";
import { PermissionsRow } from "../types/db.js";

export default function map(row: PermissionsRow): Permission {
  return {
    claims: {
      iss: row.iss,
      sub: row.sub,
    },
    access: {
      read: row.read === 1,
      write: row.write === 1,
      admin: row.admin === 1,
      metadata: row.metadata === 1,
      publish: row.publish === 1,
      subscribe:
        row.publish === 1 || row.subscribe === 1
          ? true
          : row.subscribe === 0
          ? false
          : row.read === 1
          ? true
          : false,
    },
  };
}
