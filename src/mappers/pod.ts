import { PodInfo } from "../types/types.js";
import { PodsRow } from "../types/db.js";

export default function map(row: PodsRow): PodInfo {
  return {
    claims: { iss: row.iss, sub: row.sub },
    pod: row.pod,
    hostname: row.hostname,
    hostnameAlias: row.hostname_alias,
    createdAt: row.created_at,
    dataDir: row.data_dir,
    tier: row.tier,
  };
}
