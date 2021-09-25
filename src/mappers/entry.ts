import { LogEntry } from "../types/index.js";
import { EntriesRow } from "../types/db.js";

export default function map(row: EntriesRow): LogEntry {
  return {
    id: row.id,
    contentHash: row.content_hash,
    commit: row.commit,
    previousCommit: row.previous_commit,
    data: row.data,
    type: row.type,
    iss: row.iss,
    sub: row.sub,
    createdAt: row.created_at
  };
}
