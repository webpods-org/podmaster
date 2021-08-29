import { PodInfo } from "../types/types.js";
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
  const hashOfPodName = getHashCode(pod);
  return (hashOfPodName % appConfig.storage.podsDirCount).toString();
}
