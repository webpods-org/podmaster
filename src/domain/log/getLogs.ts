import * as db from "../../db/index.js";
import { LogsRow } from "../../types/db.js";
import { Result } from "../../types/api.js";
import ensurePod from "../pod/ensurePod.js";
import { ACCESS_DENIED } from "../../errors/codes.js";
import { getPodDataDir } from "../../storage/index.js";

export type GetLogsResult = {
  logs: {
    id: string;
    name: string;
    description: string;
  }[];
};

export default async function getLogs(
  iss: string,
  sub: string,
  hostname: string
): Promise<Result<GetLogsResult>> {
  return ensurePod(hostname, async (pod) => {
    if (pod.claims.iss === iss && pod.claims.sub === sub) {
      const podDataDir = getPodDataDir(pod.id);
      const podDb = db.getPodDb(podDataDir);

      const getLogsStmt = podDb.prepare(`SELECT * FROM "logs"`);

      const logs = getLogsStmt.all().map((x: LogsRow) => ({
        id: x.id,
        name: x.name,
        description: x.description,
      }));
      return { ok: true, value: { logs } };
    } else {
      return {
        ok: false,
        code: ACCESS_DENIED,
        error: "Access denied.",
      };
    }
  });
}
