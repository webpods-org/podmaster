import * as db from "../../db/index.js";
import { Identity, JwtClaims } from "../../types/index.js";
import ensurePod from "../pods/internal/ensurePod.js";
import errors from "../../errors/codes.js";
import { getPodDataDir } from "../../storage/index.js";
import getPodPermissionForJwt from "../pods/internal/getPodPermissionForJwt.js";
import { StatusCodes } from "http-status-codes";
import { InvalidResult, ValidResult } from "../../Result.js";

export type DeletePermissionsResult = {};

export default async function deletePermissions(
  hostname: string,
  identity: Identity,
  userClaims: JwtClaims
) {
  return ensurePod(hostname, async (pod) => {
    if (identity.iss === userClaims.iss && identity.sub === userClaims.sub) {
      return new InvalidResult({
        error: "Cannot delete permissions for self.",
        status: StatusCodes.BAD_REQUEST,
      });
    } else {
      // Let's see if the log already exists.
      const podDataDir = getPodDataDir(pod.id);
      const podDb = db.getPodDb(podDataDir);

      const podPermission = await getPodPermissionForJwt(
        pod.app,
        podDb,
        userClaims
      );

      if (podPermission.write) {
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

        deleteLogPermsStmt.run({
          iss: identity.iss,
          sub: identity.sub,
        });

        return new ValidResult({});
      } else {
        return new InvalidResult({
          error: "Access denied.",
          status: StatusCodes.UNAUTHORIZED,
        });
      }
    }
  });
}
