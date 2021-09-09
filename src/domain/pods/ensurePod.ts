import { MISSING_POD } from "../../errors/codes.js";
import { getPodByHostname } from "./getPodByHostname.js";
import { PodInfo } from "../../types/types.js";
import { ErrResult, OkResult } from "../../types/api.js";

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
      error: `Pod ${hostname} not found.`,
    };
  }
}
