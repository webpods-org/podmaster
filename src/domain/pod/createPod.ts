import { JwtClaims } from "../../types/types";
import * as config from "../../config";
import { ACCESS_DENIED, INVALID_CLAIM } from "../../errors/codes";
import matchObject from "../../utils/matchObject";
import random from "../../utils/random";
import * as db from "../../db";
import { join } from "path";
import mkdirp = require("mkdirp");
import { Result } from "../../types/api";

export type CreatePodResult = { hostname: string; pod: string };

export default async function createPod(
  userClaims: JwtClaims
): Promise<Result<CreatePodResult>> {
  const appConfig = config.get();

  // Check if the user already has a pod.

  const systemDb = db.getSystemDb();

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
      const insertPodStmt = systemDb.prepare(
        `INSERT INTO "pods" VALUES (@issuer, @subject, @pod, @hostname, @hostname_alias, @created_at, @data_dir, @tier)`
      );

      const pod = generatePodId();

      // Gotta make a directory.
      const hostname = `${pod}.${appConfig.hostname}`;

      const podDataDir = join(appConfig.storage.dataDir, pod);

      insertPodStmt.run({
        issuer: userClaims.iss,
        subject: userClaims.sub,
        pod: pod,
        hostname,
        hostname_alias: null,
        created_at: Date.now(),
        tier: "free",
        data_dir: pod,
      });

      await mkdirp(podDataDir);

      // Create the Pod DB
      const podDb = db.getPodDb(podDataDir);
      await db.initPodDb(podDb);

      return {
        ok: true,
        pod,
        hostname,
      };
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
      code: INVALID_CLAIM,
      error:
        "Cannot create user id from claims. Check the authentication token.",
    };
  }
}

function generatePodId() {
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
