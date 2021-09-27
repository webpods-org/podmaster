import { join } from "path";
import * as db from "../../../db/index.js";
import ensurePod from "../../pods/internal/ensurePod.js";
import getLogPermissionForJwt from "../internal/getLogPermissionForJwt.js";
import isFilenameValid from "../../../lib/validation/checkFilename.js";
import { getDirNumber, getPodDataDir } from "../../../storage/index.js";
import { JwtClaims } from "../../../types/index.js";
import { StatusCodes } from "http-status-codes";
import { InvalidResult, ValidResult } from "../../../Result.js";
import { HttpError } from "../../../utils/http.js";

export type GetFileResult = {
  relativeFilePath: string;
};

export default async function getFile(
  hostname: string,
  logId: string,
  urlPath: string,
  userClaims: JwtClaims | undefined
): Promise<ValidResult<GetFileResult> | InvalidResult<HttpError>> {
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
      const [, logsLiteral, logId, filesLiteral, fileName] = urlPath.split("/");
      // Some basic checks.
      if (
        logId === logId &&
        logsLiteral.toLowerCase() === "logs" &&
        filesLiteral.toLowerCase() === "files" &&
        isFilenameValid(fileName)
      ) {
        const relativeFilePath = join(
          getDirNumber(pod.id),
          pod.id,
          logId,
          fileName
        );
        return new ValidResult({
          relativeFilePath,
        });
      } else {
        return new InvalidResult({
          error: "The requested url was not found on this server.",
          status: StatusCodes.NOT_FOUND,
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
