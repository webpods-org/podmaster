import * as config from "../../config";
import * as db from "../../db";
import { join } from "path";
import { Result } from "../../types/api";
import ensurePod from "./ensurePod";
import { EntriesRow } from "../../types/db";
import mapper from "../../mappers/entry";
import { LogEntry, Notifier } from "../../types/types";
import { ACCESS_DENIED } from "../../errors/codes";
import { getPermissionsForLog } from "./checkPermissionsForLog";

export type GetInfoResult = {
  count: number;
  commit: string;
  notifiers: Notifier[];
};

export default async function getInfo(
  iss: string | undefined,
  sub: string | undefined,
  hostname: string,
  log: string
): Promise<Result<GetInfoResult>> {
  const appConfig = config.get();

  return ensurePod(hostname, async (pod) => {
    // Let's see if the log already exists.
    const podDataDir = join(appConfig.storage.dataDir, pod.dataDir);
    const podDb = db.getPodDb(podDataDir);

    const permissions = await getPermissionsForLog(pod, iss, sub, log, podDb);

    if (permissions.read) {
      // Get the last item
      const lastItemStmt = podDb.prepare(
        `SELECT "id", "commit" FROM "entries" ORDER BY id DESC LIMIT 1`
      );

      let { id, commit } = (lastItemStmt.get() as EntriesRow | undefined) || {
        id: 0,
        commit: "",
      };

      return {
        ok: true,
        count: id,
        commit,
        notifiers: appConfig.notifiers || [],
      };
    } else {
      return {
        ok: false,
        code: ACCESS_DENIED,
        error: "Access denied.",
      };
    }
  });
}
