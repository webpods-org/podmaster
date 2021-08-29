import { join } from "path";
import mkdirp from "mkdirp";

import { JwtClaims } from "../../types/types.js";
import * as config from "../../config/index.js";
import {
  ACCESS_DENIED,
  INVALID_CLAIM,
  MISSING_FIELD,
  POD_EXISTS,
  QUOTA_EXCEEDED,
} from "../../errors/codes.js";
import matchObject from "../../utils/matchObject.js";
import random from "../../utils/random.js";
import * as db from "../../db/index.js";
import { ErrResult, Result } from "../../types/api.js";
import { PodsRow } from "../../types/db.js";
import { generateInsertStatement } from "../../lib/sqlite.js";
import { getPodDataDir } from "../../storage/index.js";
import { getPods } from "./getPods.js";
import { getPodByHostname } from "./getPodByHostname.js";

export type CreatePodResult = { hostname: string };

export default async function createPod(
  podName: string,
  description: string,
  userClaims: JwtClaims
): Promise<Result<CreatePodResult>> {
  // Check fields
  const validationErrors = isInvalid({ podName });

  if (!validationErrors) {
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
            1. If webpods.hostname and webpods.pod exists in the jwt,
            create ${webpods.pod}.${webpods.hostname}.
            2. Check maxPodsPerUser
          If not:
            Create a randomly named pod.
        */
        const existingPods = await getPods(userClaims.iss, userClaims.sub);
        if (
          !matchingTier.maxPodsPerUser ||
          (existingPods.ok &&
            matchingTier.maxPodsPerUser > existingPods.value.pods.length)
        ) {
          const hostname = userClaims.webpods?.domain
            ? `${podName}.${userClaims.webpods.domain}.${appConfig.hostname}`
            : `${podName}.${appConfig.hostname}`;

          // Check if the pod name is available.

          const existingPod = await getPodByHostname(hostname);
          if (!existingPod) {
            // Gotta make a directory.
            const podDataDir = getPodDataDir(podName);

            const podsRow: PodsRow = {
              iss: userClaims.iss,
              sub: userClaims.sub,
              name: podName,
              hostname,
              hostname_alias: null,
              created_at: Date.now(),
              tier: "free",
              description,
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
              value: { hostname },
            };
          } else {
            return {
              ok: false,
              code: POD_EXISTS,
              error: `A pod named ${hostname} already exists.`,
            };
          }
        } else {
          return {
            ok: false,
            code: QUOTA_EXCEEDED,
            error: "Quota exceeded.",
          };
        }
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
  } else {
    return validationErrors;
  }
}

function isInvalid(input: { podName: string }): ErrResult | undefined {
  if (!input.podName) {
    return {
      ok: false,
      error: "Missing fields in input.",
      code: MISSING_FIELD,
      data: {
        fields: ["name"],
      },
    };
  }
}
