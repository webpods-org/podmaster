import { PodPermission } from "../types/types.js";
import { PodPermissionsRow } from "../types/db.js";

export default function map(row: PodPermissionsRow): PodPermission {
  return {
    identity: {
      iss: row.iss,
      sub: row.sub,
    },
    access: {
      write: row.write === 1,
      read: row.read === 1,
    },
  };
}
