import * as db from "../../db/index.js";
import {
  HttpError,
  Identity,
  PodJwtClaims,
  LogAccess,
  PodAccess,
} from "../../types/index.js";
import ensurePod from "../pods/internal/ensurePod.js";
import { getPodDataDir } from "../../storage/index.js";
import getPodPermissionForJwt from "../pods/internal/getPodPermissionForJwt.js";
import addLogPermission from "./internal/addLogPermission.js";
import addPodPermission from "./internal/addPodPermission.js";
import { StatusCodes } from "http-status-codes";
import { InvalidResult, ValidResult } from "../../Result.js";

export type AddPermissionsResult = {};

export default async function addPermissions(
  hostname: string,
  permissions: {
    identity: Identity;
    pod?: {
      access: PodAccess;
    };
    logs?: {
      log: string;
      access: LogAccess;
    }[];
  },
  userClaims: PodJwtClaims
): Promise<ValidResult<AddPermissionsResult> | InvalidResult<HttpError>> {
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
    
    if (permissions.pod) {
      await addPodPermission(
        permissions.identity,
        permissions.pod.access,
        false,
        podDb
      );
    }

    if (permissions.logs) {
      for (const logPermission of permissions.logs) {
        await addLogPermission(
          logPermission.log,
          permissions.identity,
          logPermission.access,
          false,
          podDb
        );
      }
    }

    const result: AddPermissionsResult = {};
    return new ValidResult(result);
  });
}
