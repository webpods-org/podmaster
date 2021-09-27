import * as db from "../../../db/index.js";
import { LogsRow } from "../../../types/db.js";
import { getPodDataDir } from "../../../storage/index.js";
import { PodInfo } from "../../../types/index.js";
import { InvalidResult, ValidResult } from "../../../Result.js";

export type GetLogsResult = {
  logs: {
    id: string;
    name: string;
    description: string;
  }[];
};

export default async function getLogs(
  pod: PodInfo,
  permissions: { read: boolean; write: boolean }
): Promise<ValidResult<GetLogsResult> | InvalidResult<"NO_PERMISSIONS">> {
  const podDataDir = getPodDataDir(pod.id);
  const podDb = db.getPodDb(podDataDir);

  if (!permissions.read) {
    return new InvalidResult("NO_PERMISSIONS");
  }

  const getLogsStmt = podDb.prepare(`SELECT * FROM "logs"`);

  const logs = getLogsStmt.all().map((x: LogsRow) => ({
    id: x.id,
    name: x.name,
    description: x.description,
  }));
  
  return new ValidResult({ logs });
}
