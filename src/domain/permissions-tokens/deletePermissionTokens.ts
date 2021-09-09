import * as db from "../../db/index.js";
import { Identity, JwtClaims } from "../../types/types.js";
import { Result } from "../../types/api.js";
import ensurePod from "../pod/ensurePod.js";
import { ACCESS_DENIED } from "../../errors/codes.js";
import { getPodDataDir } from "../../storage/index.js";
import { getPodPermissionsForJwt } from "../pod/getPodPermissionsForJwt.js";

export type DeletePermissionTokensResult = {};

export type LogEntry = {
  data: string;
  encoding?: "utf-8";
  previousCommit?: string;
};

export default async function deletePermissionTokens(
  hostname: string,
  identity: Identity,
  userClaims: JwtClaims
): Promise<Result<DeletePermissionTokensResult>> {
  return ensurePod(hostname, async (pod) => {
    // Let's see if the log already exists.
    const podDataDir = getPodDataDir(pod.id);
    const podDb = db.getPodDb(podDataDir);

    const podPermissions = await getPodPermissionsForJwt(podDb, userClaims);

    if (podPermissions.admin) {
      const deletePodPermsStmt = podDb.prepare(
        `DELETE FROM "pod_permissions" WHERE "iss"=@iss AND "sub"=@sub`
      );

      deletePodPermsStmt.run({
        iss: identity.iss,
        sub: identity.sub,
      });

      const deleteLogPermsStmt = podDb.prepare(
        `DELETE FROM "log_permissions" WHERE "iss"=@iss AND "sub"=@sub`
      );

      deletePodPermsStmt.run({
        iss: identity.iss,
        sub: identity.sub,
      });

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
