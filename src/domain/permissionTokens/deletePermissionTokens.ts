import * as db from "../../db/index.js";
import { HttpError, PodJwtClaims } from "../../types/index.js";
import ensurePod from "../pods/internal/ensurePod.js";
import { getPodDataDir } from "../../storage/index.js";
import getPodPermissionForJwt from "../pods/internal/getPodPermissionForJwt.js";
import { StatusCodes } from "http-status-codes";
import { InvalidResult, ValidResult } from "../../Result.js";

export type DeletePermissionTokensResult = {};

export default async function deletePermissionTokens(
  hostname: string,
  id: string,
  userClaims: PodJwtClaims
): Promise<
  ValidResult<DeletePermissionTokensResult> | InvalidResult<HttpError>
> {
  return ensurePod(hostname, async (pod) => {
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
    
    const deleteTokensStmt = podDb.prepare(
      `DELETE FROM "permission_token" WHERE "id"=@id`
    );

    deleteTokensStmt.run({ id });

    const result: DeletePermissionTokensResult = {};
    return new ValidResult(result);
  });
}
