import { PodInfo } from "../types/types";
import { PodsRow } from "../types/db";

export default function map(row: PodsRow): PodInfo {
  return {
    issuer: row.issuer,
    subject: row.subject,
    pod: row.pod,
    hostname: row.hostname,
    hostnameAlias: row.hostname_alias,
    createdAt: row.created_at,
    dataDir: row.data_dir,
    tier: row.tier,
  };
}
