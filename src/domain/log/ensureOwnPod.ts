import { ACCESS_DENIED, MISSING_POD } from "../../errors/codes";
import { getPodByHostname } from "../pod/getPodByHostname";
import { PodInfo } from "../../types/types";
import { ErrResult, OkResult } from "../../types/api";

export default async function ensureOwnPod<T>(
  iss: string,
  sub: string,
  hostname: string,
  then: (pod: PodInfo) => Promise<OkResult<T> | ErrResult>
): Promise<OkResult<T> | ErrResult> {
  const pod = await getPodByHostname(hostname);

  if (pod) {
    if (pod.claims.iss === iss && pod.claims.sub === sub) {
      return then(pod);
    } else {
      return {
        ok: false,
        code: ACCESS_DENIED,
        error: "Access denied.",
      };
    }
  } else {
    return {
      ok: false,
      code: MISSING_POD,
      error: "Pod not found.",
    };
  }
}
