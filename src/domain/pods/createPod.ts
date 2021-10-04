import mkdirp from "mkdirp";

import { HttpError, JwtClaims } from "../../types/index.js";
import * as config from "../../config/index.js";
import matchObject from "../../utils/matchObject.js";
import * as db from "../../db/index.js";
import { PodPermissionsRow, PodsRow } from "../../types/db.js";
import { generateInsertStatement } from "../../lib/sqlite.js";
import { getPodDataDir } from "../../storage/index.js";
import getPodsImpl from "./internal/getPods.js";
import { isAlphanumeric } from "../../api/utils/isAlphanumeric.js";
import { StatusCodes } from "http-status-codes";
import { InvalidResult, ValidResult } from "../../Result.js";
import getUserHostFromJwt from "./internal/getUserHostFromJwt.js";
import hasScope from "../../lib/jwt/hasScope.js";

export type CreatePodResult = { hostname: string };

export default async function createPod(
  podId: string,
  podTitle: string,
  app: string,
  description: string,
  userClaims: JwtClaims
): Promise<ValidResult<CreatePodResult> | InvalidResult<HttpError>> {
  // Check fields
  const validationErrors = validateInput({ podId, app });

  if (validationErrors) {
    return validationErrors;
  }

  const appConfig = config.get();
  const systemDb = db.getSystemDb();

  if (appConfig.requireNamespace !== false && !userClaims.webpods?.namespace) {
    return new InvalidResult({
      error: "Invalid JWT. Missing claim 'webpods.namespace'.",
      status: StatusCodes.UNAUTHORIZED,
    });
  }

  // hostname for users can vary based on the JWT
  // If the JWT defines a namespace (optional), it'll be under "namespace.podmasterhostname".
  const podHostname = `${podId}.${getUserHostFromJwt(userClaims)}`;

  // First check if we have a valid issuer and audience.
  // Audience defaults to hostname of podmaster, but can be overridden.
  const authenticator = appConfig.authenticators.find((issuer) =>
    matchObject({ aud: appConfig.hostname, ...issuer.claims }, userClaims)
  );

  if (!authenticator) {
    return new InvalidResult({
      error: "Access denied.",
      status: StatusCodes.UNAUTHORIZED,
    });
  }

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
  if (!matchingTier) {
    return new InvalidResult({
      error: "Access denied.",
      status: StatusCodes.UNAUTHORIZED,
    });
  }

  const existingPods = await getPodsImpl(userClaims.iss, userClaims.sub);

  if (
    matchingTier.maxPodsPerUser &&
    existingPods.length >= matchingTier.maxPodsPerUser
  ) {
    return new InvalidResult({
      error: "Quota exceeded.",
      status: StatusCodes.INSUFFICIENT_SPACE_ON_RESOURCE,
    });
  }

  // Check if the pod already exists - (by hostname).
  if (existingPods.some((x) => x.hostname === podHostname)) {
    return new InvalidResult({
      error: `A pod with hostname ${podHostname} already exists.`,
      status: StatusCodes.CONFLICT,
    });
  }

  // Check if the pod already exists - (by app).
  if (existingPods.some((x) => x.app === app)) {
    return new InvalidResult({
      error: `A pod connected to app ${app} already exists.`,
      status: StatusCodes.CONFLICT,
    });
  }

  // Let's see if we have permissions.
  if (!hasScope(userClaims.scope, app, "write")) {
    return new InvalidResult({
      error: `Access denied. You don't have permissions to create a pod for the app ${app}.`,
      status: StatusCodes.UNAUTHORIZED,
    });
  }

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
    generateInsertStatement<PodsRow>("pod", podsRow)
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
      "pod_permission",
      podPermissionsRow
    )
  );

  insertPodPermissionStmt.run(podPermissionsRow);

  const result: CreatePodResult = { hostname: podHostname };
  return new ValidResult(result);
}

function validateInput(input: {
  podId: string;
  app: string;
}): InvalidResult<HttpError> | null {
  if (!input.podId) {
    return new InvalidResult({
      error: "Missing fields in input.",
      status: StatusCodes.BAD_REQUEST,
    });
  } else if (!isAlphanumeric(input.podId)) {
    return new InvalidResult({
      error: "Pod name can only contains letters, numbers and hyphens.",
      status: StatusCodes.BAD_REQUEST,
    });
  } else if (input.app && input.app.length > 32) {
    return new InvalidResult({
      error:
        "App id must be a non-empty string which is at most 32 characters long.",
      status: StatusCodes.BAD_REQUEST,
    });
  }
  return null;
}
