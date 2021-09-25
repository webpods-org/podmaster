import { PodInfo } from "../types/index.js";
import { PodsRow } from "../types/db.js";

export default function map(row: PodsRow): PodInfo {
  return {
    createdBy: { iss: row.iss, sub: row.sub },
    id: row.id,
    name: row.name,
    app: row.app,
    hostname: row.hostname,
    createdAt: row.created_at,
    tier: row.tier,
    description: row.description,
  };
}
