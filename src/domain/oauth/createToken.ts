import { Authenticator, JwtClaims } from "../../types/types.js";
import * as config from "../../config/index.js";
import {
  ACCESS_DENIED,
  INVALID_JWT,
  MISSING_FIELD,
  OAUTH_UNSUPPORTED_GRANT_TYPE,
} from "../../errors/codes.js";
import matchObject from "../../utils/matchObject.js";
import { Result } from "../../types/api.js";
import jsonwebtoken, { SignOptions } from "jsonwebtoken";
import getJwtValidationParams from "../../lib/jwt/getJwtValidationParams.js";
import validateJwt from "../../lib/jwt/validateJwt.js";

export type CreateAuthTokenResult = {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
};

export default async function createAuthToken(
  grantType: string,
  assertion: string,
  audience: string
): Promise<Result<CreateAuthTokenResult>> {
  if (grantType === "webpods-jwt-bearer") {
    if (audience) {
      const appConfig = config.get();
      const assertionClaimsResult = getClaimsFromAssertion(assertion);
      if (assertionClaimsResult.ok) {
        const { value: claimsInAssertion } = assertionClaimsResult;
        const getAuthenticatorResult = getAuthenticator(claimsInAssertion);

        if (getAuthenticatorResult.ok) {
          const authenticator = getAuthenticatorResult.value;
          const jwtParamsResult = await getJwtValidationParams(assertion);

          if (jwtParamsResult.ok) {
            const { value: jwtParams } = jwtParamsResult;

            const validatedClaims = await validateJwt(
              appConfig.hostname,
              assertion,
              jwtParams.publicKey,
              jwtParams.alg
            );

            if (validatedClaims !== null) {
              const issuer = `https://${appConfig.hostname}/`;

              const expiresIn = claimsInAssertion.exp
                ? claimsInAssertion.exp - Math.floor(Date.now() / 1000)
                : appConfig.auth.defaultExpiry || 300;

              const keyid = config.getPodmasterJWK().kid;
              const subject = `${authenticator.name}/${claimsInAssertion.sub}`;
              const signOptions: SignOptions = {
                audience: audience,
                algorithm: "RS256",
                expiresIn,
                issuer,
                keyid,
                subject,
              };
              const jwt = jsonwebtoken.sign(
                {
                  scope: claimsInAssertion.scope,
                },
                appConfig.auth.keys.privateKey,
                signOptions
              );

              return {
                ok: true,
                value: {
                  access_token: jwt,
                  token_type: "bearer",
                  expires_in: expiresIn,
                },
              };
            } else {
              return {
                ok: false,
                code: INVALID_JWT,
                error: "The assertion could not be validated.",
              };
            }
          } else {
            return {
              ok: false,
              code: INVALID_JWT,
              error: "Invalid JWT.",
            };
          }
        } else {
          return getAuthenticatorResult;
        }
      } else {
        return assertionClaimsResult;
      }
    } else {
      return {
        ok: false,
        code: MISSING_FIELD,
        error: "The aud field is required.",
      };
    }
  } else {
    return {
      ok: false,
      code: OAUTH_UNSUPPORTED_GRANT_TYPE,
      error: "The grant_type parameter must be 'webpods-jwt-bearer'.",
    };
  }
}

type AssertionClaims = {
  iss: string;
  sub: string;
  [key: string]: any;
};

function getClaimsFromAssertion(token: string): Result<AssertionClaims> {
  // Let's see if the issuer is valid.
  const decodeResult = jsonwebtoken.decode(token, { complete: true });

  if (decodeResult === null) {
    return {
      ok: false,
      error: "The assertion field must be a valid JWT.",
      code: INVALID_JWT,
    };
  }

  const { payload } = decodeResult;

  if (
    payload.iss &&
    payload.sub &&
    typeof payload.iss === "string" &&
    typeof payload.sub === "string"
  ) {
    return { ok: true, value: payload as AssertionClaims };
  } else {
    return {
      ok: false,
      error: "The sub field is missing in the assertion.",
      code: INVALID_JWT,
    };
  }
}

function getAuthenticator(payload: AssertionClaims): Result<Authenticator> {
  const appConfig = config.get();

  const authenticator = appConfig.authenticators.find((authenticator) =>
    matchObject({ aud: appConfig.hostname, ...authenticator.claims }, payload)
  );

  return authenticator
    ? { ok: true, value: authenticator }
    : {
        ok: false,
        error: "The issuer in the JWT is not recognized.",
        code: INVALID_JWT,
      };
}
