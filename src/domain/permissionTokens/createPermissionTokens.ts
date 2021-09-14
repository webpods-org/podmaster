import * as db from "../../db/index.js";
import { JwtClaims, LogAccess } from "../../types/types.js";
import { Result } from "../../types/api.js";
import ensurePod from "../pods/util/ensurePod.js";
import { ACCESS_DENIED } from "../../errors/codes.js";
import { PermissionTokensRow } from "../../types/db.js";
import { generateInsertStatement } from "../../lib/sqlite.js";
import { getPodDataDir } from "../../storage/index.js";
import getPodPermissionForJwt from "../pods/util/getPodPermissionForJwt.js";
import random from "../../utils/random.js";

export type CreatePermissionTokenResult = {
  id: string;
};

export default async function createPermissionTokens(
  hostname: string,
  permissions: {
    logs?: {
      log: string;
      access: LogAccess;
    }[];
  },
  maxRedemptions: number,
  expiry: number,
  userClaims: JwtClaims
): Promise<Result<CreatePermissionTokenResult>> {
  return ensurePod(hostname, async (pod) => {
    // Let's see if the log already exists.
    const podDataDir = getPodDataDir(pod.id);
    const podDb = db.getPodDb(podDataDir);

    const podPermission = await getPodPermissionForJwt(podDb, userClaims);

    if (podPermission.write) {
      const id = random();
      const permissionsJson = JSON.stringify(permissions);

      const permissionTokensRow: PermissionTokensRow = {
        id,
        permissions_json: permissionsJson,
        max_redemptions: maxRedemptions,
        redemptions: 0,
        expiry: expiry,
        created_at: Date.now(),
      };

      const insertStmt = podDb.prepare(
        generateInsertStatement<PermissionTokensRow>(
          "permission_tokens",
          permissionTokensRow
        )
      );

      insertStmt.run(permissionTokensRow);

      return {
        ok: true,
        value: { id },
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
