import getPodByHostname from "./getPodByHostname.js";
import { PodInfo, HttpError } from "../../../types/index.js";
import { InvalidResult } from "../../../Result.js";
import { StatusCodes } from "http-status-codes";

export default async function ensurePod<T>(
  hostname: string,
  then: (pod: PodInfo) => Promise<T | InvalidResult<HttpError>>
): Promise<T | InvalidResult<HttpError>> {
  const pod = await getPodByHostname(hostname);

  if (pod) {
    return then(pod);
  } else {
    return new InvalidResult({
      error: `Pod ${hostname} not found.`,
      status: StatusCodes.NOT_FOUND,
    });
  }
}
