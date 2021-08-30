import { join } from "path";
import * as db from "../../db/index.js";
import { Result } from "../../types/api.js";
import ensurePod from "../pod/ensurePod.js";
import { ACCESS_DENIED, NOT_FOUND } from "../../errors/codes.js";
import { getPermissionsForLog } from "./checkPermissionsForLog.js";
import isFilenameValid from "../../lib/validation/checkFilename.js";
import { getDirNumber, getPodDataDir } from "../../storage/index.js";

export type GetFileResult = {
  relativeFilePath: string;
};

export default async function getFile(
  iss: string | undefined,
  sub: string | undefined,
  hostname: string,
  logName: string,
  urlPath: string
): Promise<Result<GetFileResult>> {
  return ensurePod(hostname, async (pod) => {
    // Let's see if the log already exists.
    const podDataDir = getPodDataDir(pod.id);
    const podDb = db.getPodDb(podDataDir);

    const permissions = await getPermissionsForLog(iss, sub, logName, podDb);

    if (permissions.read) {
      const [, logsLiteral, logName, filesLiteral, fileName] =
        urlPath.split("/");
      // Some basic checks.
      if (
        logName === logName &&
        logsLiteral.toLowerCase() === "logs" &&
        filesLiteral.toLowerCase() === "files" &&
        isFilenameValid(fileName)
      ) {
        const relativeFilePath = join(
          getDirNumber(pod.id),
          pod.id,
          logName,
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
