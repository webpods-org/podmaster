import mkdirp from "mkdirp";

import { JwtClaims } from "../../types/types.js";
import * as config from "../../config/index.js";
import {
  ACCESS_DENIED,
  MISSING_FIELD,
  POD_EXISTS,
  QUOTA_EXCEEDED,
} from "../../errors/codes.js";
import matchObject from "../../utils/matchObject.js";
import * as db from "../../db/index.js";
import { ErrResult, Result } from "../../types/api.js";
import { PodsRow } from "../../types/db.js";
import { generateInsertStatement } from "../../lib/sqlite.js";
import { getPodDataDir } from "../../storage/index.js";
import { getPods } from "./getPods.js";
import { getPodByHostname } from "./getPodByHostname.js";

export type CreatePodResult = { hostname: string };

export default async function createPod(
  podId: string,
  podTitle: string,
  description: string,
  admin: {
    claims: {
      iss: string;
      sub: string;
    };
  },
  userClaims: JwtClaims
): Promise<Result<CreatePodResult>> {
  const appConfig = config.get();

  // Check fields
  const validationErrors = isInvalid({ podId });

  if (!validationErrors) {
    const appConfig = config.get();

    // Check if the user already has a pod.
    const systemDb = db.getSystemDb();

    const podHostname = `${podId}.${appConfig.hostname}`;

    // First check if we have a valid issuer and audience.
    // Audience defaults to hostname of podmaster, but can be overridden.
    const isValidIssuer = appConfig.jwtIssuers.some((issuer) =>
      matchObject({ aud: appConfig.hostname, ...issuer.claims }, userClaims)
    );

    if (isValidIssuer) {
      const matchingTier = appConfig.tiers.find((tier) =>
        matchObject(tier.claims, userClaims)
      );

      /*
        Verify the claims and create the pod.
        The rules are:
          1. If webpods.hostname and webpods.pod exists in the jwt,
          create ${webpods.pod}.${webpods.hostname}.
          2. Check maxPodsPerUser
      */
      if (matchingTier) {
        const existingPodsResult = await getPods(userClaims);

        if (existingPodsResult.ok) {
          if (
            !matchingTier.maxPodsPerUser ||
            (existingPodsResult.ok &&
              matchingTier.maxPodsPerUser >
                existingPodsResult.value.pods.length)
          ) {
            // Check if the pod name is available.

            const existingPod = await getPodByHostname(podHostname);
            if (!existingPod) {
              // Gotta make a directory.
              const podDataDir = getPodDataDir(podId);

              const podsRow: PodsRow = {
                iss: userClaims.iss,
                sub: userClaims.sub,
                id: podId,
                name: podTitle,
                hostname: podHostname,
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

              // Insert admin permissions.
              const podPermissionsRow = {
                iss: admin.claims.iss,
                sub: admin.claims.sub,
                admin: 1,
                read: 1,
                write: 1,
                created_at: Date.now(),
              };
              const insertPodPermissionStmt = podDb.prepare(
                generateInsertStatement("pod_permissions", podPermissionsRow)
              );

              insertPodPermissionStmt.run(podPermissionsRow);

              return {
                ok: true,
                value: { hostname: podHostname },
              };
            } else {
              return {
                ok: false,
                code: POD_EXISTS,
                error: `A pod named ${podHostname} already exists.`,
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
          return existingPodsResult;
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
        code: ACCESS_DENIED,
        error: "Access denied.",
      };
    }
  } else {
    return validationErrors;
  }
}

function isInvalid(input: { podId: string }): ErrResult | undefined {
  if (!input.podId) {
    return {
      ok: false,
      error: "Missing fields in input.",
      code: MISSING_FIELD,
      data: {
        fields: ["id"],
      },
    };
  }
}
