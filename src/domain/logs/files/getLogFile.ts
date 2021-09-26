import { join } from "path";
import * as db from "../../../db/index.js";
import { Result } from "../../../types/api.js";
import ensurePod from "../../pods/util/ensurePod.js";
import errors from "../../../errors/codes.js";
import getLogPermissionForJwt from "../util/getLogPermissionForJwt.js";
import isFilenameValid from "../../../lib/validation/checkFilename.js";
import { getDirNumber, getPodDataDir } from "../../../storage/index.js";
import { JwtClaims } from "../../../types/index.js";

export type GetFileResult = {
  relativeFilePath: string;
};

export default async function getFile(
  hostname: string,
  logId: string,
  urlPath: string,
  userClaims: JwtClaims | undefined
): Promise<Result<GetFileResult>> {
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
        return {
          ok: true,
          value: { relativeFilePath },
        };
      } else {
        return {
          ok: false,
          code: errors.NOT_FOUND,
          error: "The requested url was not found on this server.",
        };
      }
    } else {
      return {
        ok: false,
        code: errors.ACCESS_DENIED,
        error: "Access denied.",
      };
    }
  });
}
