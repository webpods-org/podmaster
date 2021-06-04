import * as config from "../../config";
import * as db from "../../db";
import { MISSING_POD } from "../../errors/codes";
import { join } from "path";
import random from "../../utils/random";
import { getPodByHostname } from "../pod/getPodByHostname";
import { LogsRow } from "../../types/db";
import { Result } from "../../types/api";
import ensurePod from "./ensurePod";
import ensureOwnPod from "./ensureOwnPod";

export type GetLogsResult = {
  logs: {
    log: string;
  }[];
};

export default async function getLogs(
  iss: string,
  sub: string,
  hostname: string,
  tags: string | undefined
): Promise<Result<GetLogsResult>> {
  const appConfig = config.get();

  return ensureOwnPod(iss, sub, hostname, async (pod) => {
    const tagsList = tags ? tags.split(",") : [];

    const podDataDir = join(appConfig.storage.dataDir, pod.dataDir);
    const podDb = db.getPodDb(podDataDir);
    const getLogsStmt = podDb.prepare(`SELECT * FROM "logs"`);

    const logs = getLogsStmt
      .all()
      .map((x: LogsRow) => ({
        log: x.log,
        tags: x.tags,
      }))
      .filter((x) => {
        if (!tags) {
          return true;
        } else {
          const logTags = x.tags?.split(",");
          return logTags && tagsList.every((tag) => logTags.includes(tag));
        }
      });

    return { ok: true, logs };
  });
}
