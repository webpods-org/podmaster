import * as config from "../../config";
import { MISSING_POD } from "../../errors/codes";
import { getPodByHostname } from "../pod/getPodByHostname";
import { PodInfo } from "../../types/types";
import { ErrResult, OkResult, Result } from "../../types/api";

export default async function ensurePod<T>(
  hostname: string,
  then: (pod: PodInfo) => Promise<OkResult<T> | ErrResult>
): Promise<OkResult<T> | ErrResult> {
  const pod = await getPodByHostname(hostname);

  if (pod) {
    return then(pod);
  } else {
    return {
      ok: false,
      code: MISSING_POD,
      error: "Pod not found.",
    };
  }
}
