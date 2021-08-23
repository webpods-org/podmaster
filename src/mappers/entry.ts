import { LogEntry } from "../types/types.js";
import { EntriesRow } from "../types/db.js";

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
