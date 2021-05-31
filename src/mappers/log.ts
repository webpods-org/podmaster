import { LogInfo } from "../types/types";
import { LogsRow } from "../types/db";

export default function map(row: LogsRow): LogInfo {
  return {
    pod: row.pod,
    log: row.log,
    createdAt: row.created_at,
    tags: row.tags,
  };
}
