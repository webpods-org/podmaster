import { HttpError, LimitedPodInfo, PodJwtClaims } from "../../types/index.js";
import { StatusCodes } from "http-status-codes";
import { InvalidResult, ValidResult } from "../../Result.js";
import ensurePod from "./internal/ensurePod.js";
import { getPodDataDir } from "../../storage/index.js";
import * as db from "../../db/index.js";
import getPodPermissionForJwt from "./internal/getPodPermissionForJwt.js";
import podMapper from "../../mappers/pod.js";

export default async function getPodInfo(
  hostname: string,
  userClaims: PodJwtClaims
): Promise<ValidResult<LimitedPodInfo> | InvalidResult<HttpError>> {
  return ensurePod(hostname, async (pod) => {
    // Let's see if the log already exists.
    const podDataDir = getPodDataDir(pod.id);
    const podDb = db.getPodDb(podDataDir);
    const systemDb = db.getSystemDb();

    const podPermission = await getPodPermissionForJwt(
      pod.app,
      podDb,
      userClaims
    );

    if (podPermission.read) {
      const getPodStmt = systemDb.prepare(
        `SELECT * FROM "pod" WHERE "hostname"=@hostname`
      );

      const podRow = getPodStmt.get({ hostname });

      if (podRow) {
        const podInfo = podMapper(podRow);
        return new ValidResult({
          id: podInfo.id,
          name: podInfo.name,
          app: podInfo.app,
          hostname: podInfo.hostname,
          createdBy: podInfo.createdBy,
          createdAt: podInfo.createdAt,
          tier: podInfo.tier,
          description: podInfo.description,
        });
      } else {
        return new InvalidResult({
          error: "Unknown error.",
          status: StatusCodes.INTERNAL_SERVER_ERROR,
        });
      }
    } else {
      return new InvalidResult({
        error: "Access denied.",
        status: StatusCodes.UNAUTHORIZED,
      });
    }
  });
}
