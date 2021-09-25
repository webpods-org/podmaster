import { LogAccess, PermissionToken, PodPermission } from "../types/index.js";
import { PermissionTokensRow, PodPermissionsRow } from "../types/db.js";

export default function map(row: PermissionTokensRow): PermissionToken {
  return {
    id: row.id,
    permissions: JSON.parse(row.permissions_json) as {
      logs: {
        log: string;
        access: LogAccess;
      }[];
    },
    maxRedemptions: row.max_redemptions,
    redemptions: row.redemptions,
    expiry: row.expiry,
    createdAt: row.created_at,
  };
}
