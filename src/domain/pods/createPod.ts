import mkdirp from "mkdirp";

import { JwtClaims } from "../../types/index.js";
import * as config from "../../config/index.js";
import {
  ACCESS_DENIED,
  INVALID_APP_ID,
  INVALID_POD_NAME,
  MISSING_FIELD,
  POD_EXISTS,
  QUOTA_EXCEEDED,
} from "../../errors/codes.js";
import matchObject from "../../utils/matchObject.js";
import * as db from "../../db/index.js";
import { ErrResult, Result } from "../../types/api.js";
import { PodPermissionsRow, PodsRow } from "../../types/db.js";
import { generateInsertStatement } from "../../lib/sqlite.js";
import { getPodDataDir } from "../../storage/index.js";
import { getPods } from "./getPods.js";
import getPodByHostname from "./util/getPodByHostname.js";
import { isAlphanumeric } from "../../api/utils/isAlphanumeric.js";
import getPodByHostnameOrApp from "./util/getPodByHostnameOrApp.js";

export type CreatePodResult = { hostname: string };

export default async function createPod(
  podId: string,
  podTitle: string,
  app: string,
  description: string,
  userClaims: JwtClaims
): Promise<Result<CreatePodResult>> {
  // Check fields
  const validationErrors = validateInput({ podId, app });

  if (validationErrors === null) {
    const appConfig = config.get();
    const systemDb = db.getSystemDb();

    const podHostname = userClaims.webpods?.domain
      ? `${podId}.${userClaims.webpods.domain}.${appConfig.hostname}`
      : `${podId}.${appConfig.hostname}`;

    // First check if we have a valid issuer and audience.
    // Audience defaults to hostname of podmaster, but can be overridden.
    const authenticator = appConfig.authenticators.find((issuer) =>
      matchObject({ aud: appConfig.hostname, ...issuer.claims }, userClaims)
    );

    if (authenticator) {
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

            const existingPod = await getPodByHostnameOrApp(podHostname, app);

            if (!existingPod) {
              // Gotta make a directory.
              const podDataDir = getPodDataDir(podId);

              const podsRow: PodsRow = {
                iss: userClaims.iss,
                sub: userClaims.sub,
                id: podId,
                name: podTitle,
                app: app,
                hostname: podHostname,
                hostname_alias: null,
                created_at: Date.now(),
                tier: "free",
                description,
              };

              const insertPodStmt = systemDb.prepare(
                generateInsertStatement<PodsRow>("pods", podsRow)
              );

              insertPodStmt.run(podsRow);

              await mkdirp(podDataDir);

              // Create the Pod DB
              const podDb = db.getPodDb(podDataDir);
              await db.initPodDb(podDb);

              // Insert write permissions.
              const podPermissionsRow: PodPermissionsRow = {
                iss: `https://${appConfig.hostname}/`,
                sub: `${authenticator.name}/${userClaims.sub}`,
                read: 1,
                write: 1,
                created_at: Date.now(),
              };
              const insertPodPermissionStmt = podDb.prepare(
                generateInsertStatement<PodPermissionsRow>(
                  "pod_permissions",
                  podPermissionsRow
                )
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
                error: `A pod with ${podHostname} connected to app ${app} already exists.`,
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

function validateInput(input: {
  podId: string;
  app: string;
}): ErrResult | null {
  if (!input.podId) {
    return {
      ok: false,
      error: "Missing fields in input.",
      code: MISSING_FIELD,
      data: {
        fields: ["id"],
      },
    };
  } else if (!isAlphanumeric(input.podId)) {
    return {
      ok: false,
      error: "Pod name can only contains letters, numbers and hyphens.",
      code: INVALID_POD_NAME,
    };
  } else if (input.app && input.app.length > 32) {
    return {
      ok: false,
      error:
        "App id must be a non-empty string which is at most 32 characters long.",
      code: INVALID_APP_ID,
    };
  }
  return null;
}
