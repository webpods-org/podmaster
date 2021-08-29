import { PodPermission } from "../types/types.js";
import { PodPermissionsRow } from "../types/db.js";

export default function map(row: PodPermissionsRow): PodPermission {
  return {
    claims: {
      iss: row.iss,
      sub: row.sub,
    },
    access: {
      admin: row.admin === 1,
      write: row.write === 1,
      read: row.read === 1,
    },
  };
}
