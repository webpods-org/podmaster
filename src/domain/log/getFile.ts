import * as config from "../../config";
import * as db from "../../db";
import { join } from "path";
import { Result } from "../../types/api";
import ensurePod from "../pod/ensurePod";
import { ACCESS_DENIED, NOT_FOUND } from "../../errors/codes";
import { getPermissionsForLog } from "./checkPermissionsForLog";
import isFilenameValid from "../../lib/validation/checkFilename";

export type GetFileResult = {
  root: string;
  filePath: string;
};

export default async function getFile(
  iss: string | undefined,
  sub: string | undefined,
  hostname: string,
  log: string,
  urlPath: string
): Promise<Result<GetFileResult>> {
  const appConfig = config.get();

  return ensurePod(hostname, async (pod) => {
    // Let's see if the log already exists.
    const podDataDir = join(appConfig.storage.dataDir, pod.dataDir);
    const podDb = db.getPodDb(podDataDir);

    const permissions = await getPermissionsForLog(pod, iss, sub, log, podDb);

    if (permissions.read) {
      const [, logsLiteral, logName, filesLiteral, fileName] =
        urlPath.split("/");
      // Some basic checks.
      if (
        logName === log &&
        logsLiteral.toLowerCase() === "logs" &&
        filesLiteral.toLowerCase() === "files" &&
        isFilenameValid(fileName)
      ) {
        const filePath = join(pod.dataDir, log, fileName);
        return {
          ok: true,
          value: { root: appConfig.storage.dataDir, filePath },
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
