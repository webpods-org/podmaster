import { LogInfo, Permission } from "../types/types";
import { LogsRow, PermissionsRow } from "../types/db";

export default function map(row: PermissionsRow): Permission {
  return {
    claims: {
      iss: row.iss,
      sub: row.sub,
    },
    access: {
      read: row.read === 1 ? true : false,
      write: row.write === 1 ? true : false,
      admin: row.admin === 1 ? true : false,
      metadata: row.metadata === 1 ? true : false,
    },
  };
}
