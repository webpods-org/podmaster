import * as db from "../../db/index.js";
import { Result } from "../../types/api.js";
import ensurePod from "../pod/ensurePod.js";
import { EntriesRow } from "../../types/db.js";
import { ACCESS_DENIED } from "../../errors/codes.js";
import { getPermissionsForLog } from "./getPermissionsForLog.js";
import { getPodDataDir } from "../../storage/index.js";
import { JwtClaims } from "../../types/types.js";

export type GetInfoResult = {
  id: number;
  commit: string;
};

export default async function getInfo(
  hostname: string,
  logId: string,
  userClaims: JwtClaims | undefined
): Promise<Result<GetInfoResult>> {
  return ensurePod(hostname, async (pod) => {
    // Let's see if the log already exists.
    const podDataDir = getPodDataDir(pod.id);
    const podDb = db.getPodDb(podDataDir);

    const permissions = await getPermissionsForLog(
      hostname,
      logId,
      podDb,
      userClaims
    );

    if (permissions.read) {
      // Get the last item
      const lastItemStmt = podDb.prepare(
        `SELECT "id", "commit" FROM "entries" ORDER BY id DESC LIMIT 1`
      );

      const { id, commit } = (lastItemStmt.get() as EntriesRow | undefined) || {
        id: 0,
        commit: "",
      };

      return {
        ok: true,
        value: { id, commit },
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
