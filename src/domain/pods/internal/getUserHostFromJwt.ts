import * as config from "../../../config/index.js";
import { PodmasterJwtClaims } from "../../../types/index.js";

// hostname for users can vary based on the JWT
// If the JWT defines a namespace, it'll be under "namespace.podmasterhostname".
export default function getUserHostFromJwt(
  userClaims: PodmasterJwtClaims
): string {
  const appConfig = config.get();
  return userClaims.webpods?.namespace
    ? `${userClaims.webpods.namespace}.${appConfig.hostname}`
    : `${appConfig.hostname}`;
}
