import * as db from "../../db/index.js";
import * as config from "../../config/index.js";
import mapper from "../../mappers/pod.js";
import { Result } from "../../types/api.js";
import { getPodDataDir } from "../../storage/index.js";
import { JwtClaims } from "../../types/types.js";
import { ACCESS_DENIED } from "../../errors/codes.js";
import verifyAudClaim from "../../api/utils/verifyAudClaim.js";

export type GetPodsResult = {
  pods: {
    hostname: string;
    name: string;
    description: string;
    dataDir: string;
    hostnameAlias: string | null;
  }[];
};

export async function getPods(
  userClaims: JwtClaims | undefined
): Promise<Result<GetPodsResult>> {
  const appConfig = config.get();
  const systemDb = db.getSystemDb();
  // See if it's already in predefined.
  function getPodsFromConfig(userClaims: JwtClaims) {
    return appConfig.pods
      ? appConfig.pods.filter(
          (x) =>
            x.claims.iss === userClaims.iss && x.claims.sub === userClaims.sub
        )
      : [];
  }

  function getPodsFromDb(userClaims: JwtClaims) {
    const podInfoStmt = systemDb.prepare(
      `SELECT * FROM "pods" WHERE "iss"=@iss AND "sub"=@sub`
    );

    return podInfoStmt
      .all({ iss: userClaims.iss, sub: userClaims.sub })
      .map(mapper);
  }

  if (userClaims &&
    appConfig.tiers.some(
      (x) =>
        x.claims.iss === userClaims.iss &&
        verifyAudClaim(userClaims.aud, appConfig.hostname)
    )
  ) {
    const pods = getPodsFromConfig(userClaims)
      .concat(getPodsFromDb(userClaims))
      .map((x) => ({
        hostname: x.hostname,
        hostnameAlias: x.hostnameAlias,
        name: x.name,
        description: x.description,
        dataDir: getPodDataDir(x.id),
      }));

    return { ok: true, value: { pods } };
  } else {
    return {
      ok: false,
      code: ACCESS_DENIED,
      error: "Access denied.",
    };
  }
}
