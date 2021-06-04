import { LogEntry, LogInfo, Permission } from "../types/types";
import { EntriesRow, LogsRow, PermissionsRow } from "../types/db";

export default function map(row: EntriesRow): LogEntry {
  return {
    id: row.id,
    commit: row.commit,
    previousCommit: row.previous_commit,
    data: row.data,
  };
}
