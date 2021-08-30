import * as config from "../config/index.js";
import { join } from "path";
import { getHashCode } from "../utils/getHashCode.js";

export function getPodDataDir(pod: string): string {
  const appConfig = config.get();
  const dirNumber = getDirNumber(pod);
  return join(appConfig.storage.dataDir, "pods", dirNumber, pod);
}

export function getDirNumber(pod: string): string {
  const appConfig = config.get();
  const hashOfPodId = getHashCode(pod);
  return (hashOfPodId % appConfig.storage.podsDirCount).toString();
}
