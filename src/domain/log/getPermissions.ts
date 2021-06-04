import * as config from "../../config";
import * as db from "../../db";
import { MISSING_POD } from "../../errors/codes";
import { join } from "path";
import random from "../../utils/random";
import { getPodByHostname } from "../pod/getPodByHostname";
import { Permission } from "../../types/types";
import { Result } from "../../types/api";
import mapper from "../../mappers/permission";
import ensurePod from "./ensurePod";
import ensureOwnPod from "./ensureOwnPod";

export type GetPermissionsResult = {
  permissions: Permission[];
};

export default async function getPermissions(
  iss: string,
  sub: string,
  hostname: string,
  log: string
): Promise<Result<GetPermissionsResult>> {
  const appConfig = config.get();

  return ensureOwnPod(iss,sub, hostname, async (pod) => {
    const podDataDir = join(appConfig.storage.dataDir, pod.dataDir);
    const podDb = db.getPodDb(podDataDir);

    // See if the permission already exists.
    const existingPermStmt = podDb.prepare(
      `SELECT * FROM "permissions" WHERE "log"=@log`
    );

    const permissions = existingPermStmt.all({ log }).map(mapper);

    return {
      ok: true,
      permissions,
    };
  });
}
