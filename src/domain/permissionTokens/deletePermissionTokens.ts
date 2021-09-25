import * as db from "../../db/index.js";
import { JwtClaims } from "../../types/index.js";
import { Result } from "../../types/api.js";
import ensurePod from "../pods/util/ensurePod.js";
import { ACCESS_DENIED } from "../../errors/codes.js";
import { getPodDataDir } from "../../storage/index.js";
import getPodPermissionForJwt from "../pods/util/getPodPermissionForJwt.js";

export type DeletePermissionTokensResult = {};

export default async function deletePermissionTokens(
  hostname: string,
  id: string,
  userClaims: JwtClaims
): Promise<Result<DeletePermissionTokensResult>> {
  return ensurePod(hostname, async (pod) => {
    // Let's see if the log already exists.
    const podDataDir = getPodDataDir(pod.id);
    const podDb = db.getPodDb(podDataDir);

    const podPermission = await getPodPermissionForJwt(pod.app, podDb, userClaims);

    if (podPermission.write) {
      const deleteTokensStmt = podDb.prepare(
        `DELETE FROM "permission_tokens" WHERE "id"=@id`
      );

      deleteTokensStmt.run({ id });

      return {
        ok: true,
        value: {},
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
