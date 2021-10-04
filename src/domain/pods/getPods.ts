import * as config from "../../config/index.js";
import { HttpError, JwtClaims, LimitedPodInfo } from "../../types/index.js";
import { StatusCodes } from "http-status-codes";
import { InvalidResult, ValidResult } from "../../Result.js";
import { default as getPodsImpl } from "./internal/getPods.js";

export type GetPodsResult = {
  pods: LimitedPodInfo[];
};

export default async function getPods(
  userClaims: JwtClaims
): Promise<ValidResult<{ pods: LimitedPodInfo[] }> | InvalidResult<HttpError>> {
  const appConfig = config.get();

  const hasAuthenticators = appConfig.authenticators.some(
    (x) => x.claims.iss === userClaims.iss
  );

  if (!hasAuthenticators) {
    return new InvalidResult({
      error: "Access denied.",
      status: StatusCodes.UNAUTHORIZED,
    });
  }

  // Let's see if the user has admin privileges on podmaster.
  if (!userClaims.scope || !userClaims.scope.split(" ").includes("admin")) {
    return new InvalidResult({
      error: "Access denied.",
      status: StatusCodes.UNAUTHORIZED,
    });
  }

  const pods = await getPodsImpl(userClaims.iss, userClaims.sub);
  const result: GetPodsResult = { pods };
  return new ValidResult(result);
}
