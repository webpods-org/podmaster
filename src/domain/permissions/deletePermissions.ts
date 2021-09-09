import * as db from "../../db/index.js";
import { Identity, JwtClaims } from "../../types/types.js";
import { Result } from "../../types/api.js";
import ensurePod from "../pods/util/ensurePod.js";
import { ACCESS_DENIED, CANNOT_DELETE_SELF } from "../../errors/codes.js";
import { getPodDataDir } from "../../storage/index.js";
import getPodPermissionsForJwt from "../pods/util/getPodPermissionsForJwt.js";

export type DeletePermissionsResult = {};

export type LogEntry = {
  data: string;
  encoding?: "utf-8";
  previousCommit?: string;
};

export default async function deletePermissions(
  hostname: string,
  identity: Identity,
  userClaims: JwtClaims
): Promise<Result<DeletePermissionsResult>> {
  return ensurePod(hostname, async (pod) => {
    if (identity.iss === userClaims.iss && identity.sub === userClaims.sub) {
      return {
        ok: false,
        error: "Cannot delete permissions for self.",
        code: CANNOT_DELETE_SELF,
      };
    } else {
      // Let's see if the log already exists.
      const podDataDir = getPodDataDir(pod.id);
      const podDb = db.getPodDb(podDataDir);

      const podPermissions = await getPodPermissionsForJwt(podDb, userClaims);

      if (podPermissions.write) {
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
    }
  });
}
