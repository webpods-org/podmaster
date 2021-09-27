import * as db from "../../../db/index.js";
import { Result } from "../../../types/api.js";
import ensurePod from "../../pods/internal/ensurePod.js";
import { EntriesRow } from "../../../types/db.js";
import errors from "../../../errors/codes.js";
import getLogPermissionForJwt from "../internal/getLogPermissionForJwt.js";
import { getPodDataDir } from "../../../storage/index.js";
import { JwtClaims } from "../../../types/index.js";

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

    const logPermission = await getLogPermissionForJwt(
      pod.app,
      hostname,
      logId,
      podDb,
      userClaims
    );

    if (logPermission.read) {
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
        code: errors.ACCESS_DENIED,
        error: "Access denied.",
      };
    }
  });
}
