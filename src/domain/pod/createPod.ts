import { JwtClaims } from "../../types/config";
import * as config from "../../config";
import { ACCESS_DENIED, INVALID_CLAIM } from "../../errors/codes";
import matchObject from "../../utils/matchObject";
import random from "../../utils/random";
import { getPodInfo } from "./getPodInfo";
import * as db from "../../db";
import { APIResult } from "../../types/api";
import { join } from "path";
import mkdirp = require("mkdirp");

export default async function createPod(
  userClaims: JwtClaims
): Promise<APIResult<{ hostname: string }>> {
  const appConfig = config.get();

  // Check if the user already has a pod.
  const podInfo = await getPodInfo(userClaims.iss, userClaims.sub);

  if (podInfo) {
    return {
      success: true,
      hostname: podInfo.hostname,
    };
  } else {
    const sqlite = db.get();

    if (userClaims.iss && userClaims.sub) {
      const matchingTier = appConfig.tiers.find((tier) =>
        matchObject(tier.claims, userClaims)
      );
      if (matchingTier) {
        /*
          Claims verified, create the Pod.
          The rules are:
            If webpods.hostname and webpods.pod exists in the jwt,
            create ${webpods.pod}.${webpods.hostname}.
          If not:
            Create a randomly named pod.
        */
        const insertPodStmt = sqlite.prepare(
          "INSERT INTO pods VALUES (@identity_issuer, @identity_username, @pod, @created_at, @dir, @tier)"
        );

        const pod = generatePodName();

        // Gotta make a directory.
        const hostname = `${pod}.${appConfig.hostname}`;

        insertPodStmt.run({
          identity_issuer: userClaims.iss,
          identity_username: userClaims.sub,
          pod,
          created_at: Date.now(),
          tier: "free",
          dir: "abcd",
        });

        const dirname = join(appConfig.storage.dataDir, pod);
        await mkdirp(dirname);

        return {
          success: true,
          hostname,
        };
      } else {
        return {
          success: false,
          error: "Access denied.",
          code: ACCESS_DENIED,
        };
      }
    } else {
      return {
        success: false,
        error:
          "Cannot create user id from claims. Check the authentication token.",
        code: INVALID_CLAIM,
      };
    }
  }
}

function generatePodName() {
  return random(8);
}

export function getNesting(hostname: string) {
  const appConfig = config.get();
  const baseDir =
    appConfig.storage.dirNesting.length === 0
      ? appConfig.storage.dataDir
      : (function loop() {
          const totalDirs = appConfig.storage.dirNesting.reduce(
            (acc, n) => acc * n,
            1
          );
        })();
}
