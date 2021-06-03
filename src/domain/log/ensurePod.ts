import * as config from "../../config";
import { MISSING_POD } from "../../errors/codes";
import { getPodByHostname } from "../pod/getPodByHostname";
import { PodInfo } from "../../types/types";
import { ErrResult, OkResult, Result } from "../../types/api";

export default async function ensurePod<T>(
  issuer: string,
  subject: string,
  hostname: string,
  then: (pod: PodInfo) => Promise<OkResult<T>>
): Promise<OkResult<T> | ErrResult> {
  const appConfig = config.get();
  const pod = await getPodByHostname(issuer, subject, hostname);

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
