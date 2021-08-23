import { join } from "path";
import mkdirp from "mkdirp";

import { JwtClaims } from "../../types/types.js";
import * as config from "../../config/index.js";
import { ACCESS_DENIED, INVALID_CLAIM } from "../../errors/codes.js";
import matchObject from "../../utils/matchObject.js";
import random from "../../utils/random.js";
import * as db from "../../db/index.js";
import { Result } from "../../types/api.js";
import { PodsRow } from "../../types/db.js";
import { generateInsertStatement } from "../../lib/sqlite.js";

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
      const pod = generatePodId();

      // Gotta make a directory.
      const hostname = `${pod}.${appConfig.hostname}`;

      const podDataDir = join(appConfig.storage.dataDir, pod);

      const podsRow: PodsRow = {
        iss: userClaims.iss,
        sub: userClaims.sub,
        pod: pod,
        hostname,
        hostname_alias: null,
        created_at: Date.now(),
        tier: "free",
        data_dir: pod,
      };

      const insertPodStmt = systemDb.prepare(
        generateInsertStatement("pods", podsRow)
      );

      insertPodStmt.run(podsRow);

      await mkdirp(podDataDir);

      // Create the Pod DB
      const podDb = db.getPodDb(podDataDir);
      await db.initPodDb(podDb);

      return {
        ok: true,
        value: { pod, hostname },
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
