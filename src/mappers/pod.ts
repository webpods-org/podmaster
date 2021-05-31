import { PodConfig } from "../types/config";
import { PodsRow } from "../types/db";

export default function map(row: PodsRow): PodConfig {
  return {
    issuer: row.issuer,
    username: row.username,
    pod: row.pod,
    hostname: row.hostname,
    hostnameAlias: row.hostname_alias,
    createdAt: row.created_at,
    dataDir: row.data_dir,
    tier: row.tier,
  };
}
