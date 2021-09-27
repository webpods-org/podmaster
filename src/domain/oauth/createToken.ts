import { Authenticator } from "../../types/index.js";
import * as config from "../../config/index.js";
import matchObject from "../../utils/matchObject.js";
import jsonwebtoken, { SignOptions } from "jsonwebtoken";
import getJwtValidationParams from "../../lib/jwt/getJwtValidationParams.js";
import validateJwt from "../../lib/jwt/validateJwt.js";
import {
  InvalidResult,
  unwrap,
  unwrapAsync,
  ValidResult,
} from "../../Result.js";
import { HttpError } from "../../utils/http.js";
import { StatusCodes } from "http-status-codes";

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
  if (grantType === "jwt-bearer-exchange") {
    if (aud) {
      const appConfig = config.get();

      const claims = getClaimsFromAssertion(assertion);

      const result = await unwrapAsync(claims, async (claims) => {
        const authenticator = getAuthenticator(claims);

        return await unwrapAsync(authenticator, async (authenticator) => {
          const jwtParams = await getJwtValidationParams(assertion);

          const validatedClaims = await unwrapAsync(jwtParams, (jwtParams) =>
            validateJwt(
              appConfig.hostname,
              assertion,
              jwtParams.publicKey,
              jwtParams.alg
            )
          );

          return unwrap(validatedClaims, () => {
            const issuer = `https://${appConfig.hostname}/`;

            const expiresIn = claims.exp
              ? claims.exp - Math.floor(Date.now() / 1000)
              : appConfig.auth.defaultExpiry || 300;

            const keyid = config.getPodmasterJWK().kid;
            const subject = `${authenticator.name}/${claims.sub}`;
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
                scope: claims.scope,
              },
              appConfig.auth.keys.privateKey,
              signOptions
            );

            return new ValidResult({
              access_token: jwt,
              token_type: "bearer" as "bearer",
              expires_in: expiresIn,
            });
          });
        });
      });

      return result instanceof ValidResult
        ? result
        : new InvalidResult({
            error: "The assertion is not valid.",
            status: StatusCodes.BAD_REQUEST,
          });
    } else {
      return new InvalidResult({
        error: "The aud field is required.",
        status: StatusCodes.BAD_REQUEST,
      });
    }
  } else {
    return new InvalidResult({
      error: "The grant_type parameter must be 'jwt-bearer-exchange'.",
      status: StatusCodes.BAD_REQUEST,
    });
  }
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
    payload.iss &&
    payload.sub &&
    typeof payload.iss === "string" &&
    typeof payload.sub === "string"
  ) {
    return new ValidResult(payload as AssertionClaims);
  } else {
    return new InvalidResult({
      error: "The sub field is missing in the assertion.",
      status: StatusCodes.BAD_REQUEST,
    });
  }
}

function getAuthenticator(
  payload: AssertionClaims
): ValidResult<Authenticator> | InvalidResult<HttpError> {
  const appConfig = config.get();

  const authenticator = appConfig.authenticators.find((authenticator) =>
    matchObject({ aud: appConfig.hostname, ...authenticator.claims }, payload)
  );

  return authenticator
    ? new ValidResult(authenticator)
    : new InvalidResult({
        error: "The issuer in the JWT is not recognized.",
        status: StatusCodes.BAD_REQUEST,
      });
}
