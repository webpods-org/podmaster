import { MISSING_POD } from "../../errors/codes";
import { getPodByHostname } from "./getPodByHostname";
import { PodInfo } from "../../types/types";
import { ErrResult, OkResult } from "../../types/api";

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
