import * as db from "../../db/index.js";
import * as config from "../../config/index.js";
import mapper from "../../mappers/pod.js";
import { getPodDataDir } from "../../storage/index.js";
import { JwtClaims } from "../../types/index.js";
import { StatusCodes } from "http-status-codes";
import { InvalidResult, ValidResult } from "../../Result.js";

export type GetPodsResult = {
  pods: {
    hostname: string;
    name: string;
    description: string;
    dataDir: string;
  }[];
};

export async function getPods(userClaims: JwtClaims) {
  const appConfig = config.get();
  const systemDb = db.getSystemDb();
  // See if it's already in predefined.
  function getPodsFromConfig(userClaims: JwtClaims) {
    return appConfig.pods
      ? appConfig.pods.filter(
          (x) =>
            x.createdBy.iss === userClaims.iss &&
            x.createdBy.sub === userClaims.sub
        )
      : [];
  }

  function getPodsFromDb(userClaims: JwtClaims) {
    const podInfoStmt = systemDb.prepare(
      `SELECT * FROM "pod" WHERE "iss"=@iss AND "sub"=@sub`
    );

    return podInfoStmt
      .all({ iss: userClaims.iss, sub: userClaims.sub })
      .map(mapper);
  }

  const hasAuthenticators = appConfig.authenticators.some(
    (x) => x.claims.iss === userClaims.iss
  );

  if (!hasAuthenticators) {
    return new InvalidResult({
      error: "Access denied.",
      status: StatusCodes.UNAUTHORIZED,
    });
  }

  const pods = getPodsFromConfig(userClaims)
    .concat(getPodsFromDb(userClaims))
    .map((x) => ({
      hostname: x.hostname,
      name: x.name,
      description: x.description,
      dataDir: getPodDataDir(x.id),
    }));

  const result = { pods };
  return new ValidResult(result);
}
