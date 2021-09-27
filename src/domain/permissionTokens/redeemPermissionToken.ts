import * as db from "../../db/index.js";
import { JwtClaims } from "../../types/index.js";
import ensurePod from "../pods/internal/ensurePod.js";
import { PermissionTokensRow } from "../../types/db.js";
import { generateUpdateStatement } from "../../lib/sqlite.js";
import { getPodDataDir } from "../../storage/index.js";
import permissionTokenMapper from "../../mappers/permissionToken.js";
import addLogPermission from "../permissions/internal/addLogPermission.js";
import { StatusCodes } from "http-status-codes";
import { InvalidResult, ValidResult } from "../../Result.js";
import { HttpError } from "../../utils/http.js";

export type RedeemPermissionTokenResult = {};

export default async function redeemPermissionToken(
  hostname: string,
  token: string,
  userClaims: JwtClaims
): Promise<
  ValidResult<RedeemPermissionTokenResult> | InvalidResult<HttpError>
> {
  if (userClaims.sub === "*") {
    return new InvalidResult({
      error: "The sub claim is invalid.",
      status: StatusCodes.BAD_REQUEST,
    });
  }

  return ensurePod(hostname, async (pod) => {
    // Explicity check if sub === *, since that has special meaning in permissions.
    // We do not allow sub = *

    // Let's see if the log already exists.
    const podDataDir = getPodDataDir(pod.id);
    const podDb = db.getPodDb(podDataDir);

    const getTokenStmt = podDb.prepare(
      `SELECT * FROM "permission_tokens" WHERE "id" = @id AND "expiry" > @expiry AND "max_redemptions" > "redemptions"`
    );

    
    const matchingTokens = getTokenStmt.get({
      id: token,
      expiry: Date.now(),
    });
    
    

    if (!matchingTokens) {
      return new InvalidResult({
        error: "Token is invalid or expired.",
        status: StatusCodes.UNAUTHORIZED,
      });
    }

    const permissionToken = permissionTokenMapper(matchingTokens);
    
    for (const logPermission of permissionToken.permissions.logs) {
      await addLogPermission(
        logPermission.log,
        {
          iss: userClaims.iss,
          sub: userClaims.sub,
        },
        logPermission.access,
        true,
        podDb
      );
    }

    const updateParams = { redemptions: permissionToken.redemptions + 1 };
    const updatePermStmt = podDb.prepare(
      generateUpdateStatement<PermissionTokensRow>(
        "permission_tokens",
        updateParams,
        `WHERE "id" > @id`
      )
    );

    updatePermStmt.run({ ...updateParams, id: permissionToken.id });

    const result: RedeemPermissionTokenResult = {};
    return new ValidResult(result);
  });
}
