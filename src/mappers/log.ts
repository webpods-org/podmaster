import { LogInfo } from "../types/types";
import { LogsRow } from "../types/db";

export default function map(row: LogsRow): LogInfo {
  return {
    log: row.log,
    public: row.public === 1 ? true : false,
    createdAt: row.created_at,
    tags: row.tags,
  };
}
