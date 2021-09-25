import * as db from "../../db/index.js";
import {
  Identity,
  JwtClaims,
  LogAccess,
  PodAccess,
} from "../../types/index.js";
import { Result } from "../../types/api.js";
import ensurePod from "../pods/util/ensurePod.js";
import { ACCESS_DENIED } from "../../errors/codes.js";
import { getPodDataDir } from "../../storage/index.js";
import getPodPermissionForJwt from "../pods/util/getPodPermissionForJwt.js";
import addLogPermission from "./util/addLogPermission.js";
import addPodPermission from "./util/addPodPermission.js";

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
  userClaims: JwtClaims
): Promise<Result<AddPermissionsResult>> {
  return ensurePod(hostname, async (pod) => {
    // Let's see if the log already exists.
    const podDataDir = getPodDataDir(pod.id);
    const podDb = db.getPodDb(podDataDir);

    const podPermission = await getPodPermissionForJwt(pod.app, podDb, userClaims);

    if (podPermission.write) {
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

      return {
        ok: true,
        value: {},
      };
    } else {
      return {
        ok: false,
        code: ACCESS_DENIED,
        error: "Access denied.",
      };
    }
  });
}
