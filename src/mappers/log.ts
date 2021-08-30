import { LogInfo } from "../types/types.js";
import { LogsRow } from "../types/db.js";

export default function map(row: LogsRow): LogInfo {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    public: row.public === 1,
    createdAt: row.created_at
  };
}
