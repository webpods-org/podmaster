import { Authenticator, HttpError, PodJwtClaims } from "../../types/index.js";
import * as config from "../../config/index.js";
import matchObject from "../../utils/matchObject.js";
import jsonwebtoken, { JwtPayload, SignOptions } from "jsonwebtoken";
import getJwtValidationParams from "../../lib/jwt/getJwtValidationParams.js";
import { InvalidResult, ValidResult } from "../../Result.js";
import { StatusCodes } from "http-status-codes";
import { AsymmetricAlgorithm } from "../../types/crypto.js";
import { checkAud, checkExp, checkNbf } from "../../lib/jwt/validations.js";
import { claimsFieldIsObject } from "../../lib/jwt/claimsFieldIsObject.js";

export type CreateAuthTokenResult = {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
};

export default async function createAuthToken(
  grantType: string,
  assertion: string,
  aud: string
): Promise<ValidResult<CreateAuthTokenResult> | InvalidResult<HttpError>> {
  if (grantType !== "jwt-bearer-exchange") {
    return new InvalidResult({
      error: "The grant_type parameter must be 'jwt-bearer-exchange'.",
      status: StatusCodes.BAD_REQUEST,
    });
  }

  if (!aud) {
    return new InvalidResult({
      error: "The aud field is required.",
      status: StatusCodes.BAD_REQUEST,
    });
  }

  const appConfig = config.get();

  const claims = getClaimsFromAssertion(assertion);

  if (claims instanceof InvalidResult) {
    return claims;
  }

  const authenticator = getAuthenticator(claims.value);

  if (authenticator instanceof InvalidResult) {
    return authenticator;
  }

  const jwtParams = await getJwtValidationParams(assertion);

  if (jwtParams instanceof InvalidResult) {
    return new InvalidResult({
      error: "The assertion is not valid.",
      status: StatusCodes.BAD_REQUEST,
    });
  }

  const validatedClaims = await validateJwt(
    appConfig.hostname,
    assertion,
    jwtParams.value.publicKey,
    jwtParams.value.alg
  );

  if (validatedClaims instanceof InvalidResult) {
    return new InvalidResult({
      error: "The assertion is not valid.",
      status: StatusCodes.BAD_REQUEST,
    });
  }

  const issuer = `https://${appConfig.hostname}/`;

  const expiresIn = claims.value.exp
    ? claims.value.exp - Math.floor(Date.now() / 1000)
    : appConfig.auth.defaultExpiry || 300;

  const keyid = config.getPodmasterJWK().kid;
  const subject = `${authenticator.value.name}/${claims.value.sub}`;
  const signOptions: SignOptions = {
    audience: aud,
    algorithm: "RS256",
    expiresIn,
    issuer,
    keyid,
    subject,
  };

  const jwt = jsonwebtoken.sign(
    {
      scope: claims.value.scope,
    },
    appConfig.auth.keys.privateKey,
    signOptions
  );

  return new ValidResult({
    access_token: jwt,
    token_type: "bearer" as "bearer",
    expires_in: expiresIn,
  });
}

type AssertionClaims = {
  iss: string;
  sub: string;
  [key: string]: any;
};

function getClaimsFromAssertion(
  token: string
): ValidResult<AssertionClaims> | InvalidResult<HttpError> {
  // Let's see if the issuer is valid.
  const decodeResult = jsonwebtoken.decode(token, { complete: true });

  if (decodeResult === null) {
    return new InvalidResult({
      error: "The assertion field must be a valid JWT.",
      status: StatusCodes.BAD_REQUEST,
    });
  }

  const { payload } = decodeResult;

  if (
    typeof payload === "string" ||
    !payload.iss ||
    !payload.sub ||
    typeof payload.iss !== "string" ||
    typeof payload.sub !== "string"
  ) {
    return new InvalidResult({
      error: "The sub field is missing in the assertion.",
      status: StatusCodes.BAD_REQUEST,
    });
  }

  return new ValidResult(payload as AssertionClaims);
}

function getAuthenticator(
  payload: AssertionClaims
): ValidResult<Authenticator> | InvalidResult<HttpError> {
  const appConfig = config.get();

  const authenticator = appConfig.authenticators.find((authenticator) =>
    matchObject({ aud: appConfig.hostname, ...authenticator.claims }, payload)
  );

  if (!authenticator) {
    return new InvalidResult({
      error: "The issuer in the JWT is not recognized.",
      status: StatusCodes.BAD_REQUEST,
    });
  }

  return new ValidResult(authenticator);
}

async function validateJwt(
  hostname: string,
  token: string,
  publicKey: string,
  alg: AsymmetricAlgorithm
): Promise<ValidResult<JwtPayload> | InvalidResult<"INVALID_CLAIMS">> {
  const claims = jsonwebtoken.verify(token, publicKey, {
    algorithms: [alg],
  });

  // We only support claims which are JSON objects.
  if (
    claimsFieldIsObject(claims) &&
    checkExp(claims) &&
    checkNbf(claims) &&
    checkAud(claims, [hostname])
  ) {
    // Additional checks for exp, nbf and aud
    return new ValidResult(claims);
  } else {
    return new InvalidResult("INVALID_CLAIMS");
  }
}
