import { join } from "path";

import * as config from "../../config/index.js";
import * as db from "../../db/index.js";
import { Permission } from "../../types/types.js";
import { Result } from "../../types/api.js";
import mapper from "../../mappers/permission.js";
import ensurePod from "../pod/ensurePod.js";
import { ACCESS_DENIED } from "../../errors/codes.js";
import { getPodDataDir } from "../../storage/index.js";

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
    const podDataDir = getPodDataDir(pod.name);
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
        value: { permissions },
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
