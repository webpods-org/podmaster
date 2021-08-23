import { LogInfo } from "../types/types.js";
import { LogsRow } from "../types/db.js";

export default function map(row: LogsRow): LogInfo {
  return {
    log: row.log,
    public: row.public === 1,
    createdAt: row.created_at,
    tags: row.tags,
  };
}
