import { join } from "path";
import * as db from "../../db/index.js";
import { Result } from "../../types/api.js";
import ensurePod from "../pod/ensurePod.js";
import { ACCESS_DENIED, NOT_FOUND } from "../../errors/codes.js";
import { getLogPermissionsForJwt } from "./getLogPermissionsForJwt.js";
import isFilenameValid from "../../lib/validation/checkFilename.js";
import { getDirNumber, getPodDataDir } from "../../storage/index.js";
import { JwtClaims } from "../../types/types.js";

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

    const permissions = await getLogPermissionsForJwt(
      hostname,
      logId,
      podDb,
      userClaims
    );

    if (permissions.read) {
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
          code: NOT_FOUND,
          error: "The requested url was not found on this server.",
        };
      }
    } else {
      return {
        ok: false,
        code: ACCESS_DENIED,
        error: "Access denied.",
      };
    }
  });
}
