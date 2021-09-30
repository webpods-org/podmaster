import * as db from "../../db/index.js";
import ensurePod from "../pods/internal/ensurePod.js";
import { getPodDataDir } from "../../storage/index.js";
import { HttpError, JwtClaims } from "../../types/index.js";
import getPodPermissionForJwt from "../pods/internal/getPodPermissionForJwt.js";
import { StatusCodes } from "http-status-codes";
import { InvalidResult, ValidResult } from "../../Result.js";
import { default as getLogsImpl } from "./internal/getLogs.js";

export type GetLogsResult = {
  logs: {
    id: string;
    name: string;
    description: string;
  }[];
};

export default async function getLogs(
  hostname: string,
  userClaims: JwtClaims
): Promise<ValidResult<GetLogsResult> | InvalidResult<HttpError>> {
  return ensurePod(hostname, async (pod) => {
    const podDataDir = getPodDataDir(pod.id);
    const podDb = db.getPodDb(podDataDir);

    const podPermission = await getPodPermissionForJwt(
      pod.app,
      podDb,
      userClaims
    );

    const result = await getLogsImpl(pod, podPermission);

    if (result instanceof InvalidResult) {
      return new InvalidResult({
        error: "Access denied.",
        status: StatusCodes.UNAUTHORIZED,
      });
    }

    return result;
  });
}
