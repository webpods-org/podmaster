import * as config from "../../config";
import * as db from "../../db";
import { join } from "path";
import { Permission } from "../../types/types";
import { Result } from "../../types/api";
import mapper from "../../mappers/permission";
import ensurePod from "../pod/ensurePod";
import { ACCESS_DENIED } from "../../errors/codes";

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

  return ensurePod(hostname, async (pod) => {
    const podDataDir = join(appConfig.storage.dataDir, pod.dataDir);
    const podDb = db.getPodDb(podDataDir);

    // Is own pod?
    if (pod.claims.iss === iss && pod.claims.sub === sub) {
      // See if the permission already exists.
      const existingPermStmt = podDb.prepare(
        `SELECT * FROM "permissions" WHERE "log"=@log`
      );

      const permissions = existingPermStmt.all({ log }).map(mapper);

      return {
        ok: true,
        permissions,
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
