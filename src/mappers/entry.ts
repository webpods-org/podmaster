import { LogEntry } from "../types/types";
import { EntriesRow } from "../types/db";

export default function map(row: EntriesRow): LogEntry {
  return {
    id: row.id,
    contentHash: row.content_hash,
    commit: row.commit,
    previousCommit: row.previous_commit,
    data: row.data,
    iss: row.iss,
    sub: row.sub,
  };
}
