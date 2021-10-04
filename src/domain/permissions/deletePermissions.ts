import * as db from "../../db/index.js";
import { HttpError, PodJwtClaims } from "../../types/index.js";
import ensurePod from "../pods/internal/ensurePod.js";
import { getPodDataDir } from "../../storage/index.js";
import getPodPermissionForJwt from "../pods/internal/getPodPermissionForJwt.js";
import { StatusCodes } from "http-status-codes";
import { InvalidResult, ValidResult } from "../../Result.js";

export type DeletePermissionsResult = {};

export default async function deletePermissions(
  hostname: string,
  identity: { iss?: string; sub?: string },
  userClaims: PodJwtClaims
): Promise<ValidResult<DeletePermissionsResult> | InvalidResult<HttpError>> {
  return ensurePod(hostname, async (pod) => {
    if (identity.iss === userClaims.iss && identity.sub === userClaims.sub) {
      return new InvalidResult({
        error: "Cannot delete permissions for self.",
        status: StatusCodes.BAD_REQUEST,
      });
    }

    if (!identity.iss || !identity.sub) {
      return new InvalidResult({
        error: "Missing iss and sub fields.",
        status: StatusCodes.BAD_REQUEST,
      });
    }

    // Let's see if the log already exists.
    const podDataDir = getPodDataDir(pod.id);
    const podDb = db.getPodDb(podDataDir);

    const podPermission = await getPodPermissionForJwt(
      pod.app,
      podDb,
      userClaims
    );

    if (!podPermission.write) {
      return new InvalidResult({
        error: "Access denied.",
        status: StatusCodes.UNAUTHORIZED,
      });
    }

    const deletePodPermsStmt = podDb.prepare(
      `DELETE FROM "pod_permission" WHERE "iss"=@iss AND "sub"=@sub`
    );

    deletePodPermsStmt.run({
      iss: identity.iss,
      sub: identity.sub,
    });

    const deleteLogPermsStmt = podDb.prepare(
      `DELETE FROM "log_permission" WHERE "iss"=@iss AND "sub"=@sub`
    );

    deleteLogPermsStmt.run({
      iss: identity.iss,
      sub: identity.sub,
    });

    const result: DeletePermissionsResult = {};
    return new ValidResult(result);
  });
}
