import jwksClient, { SigningKey } from "jwks-rsa";
import * as config from "../../config";
import {
  ACCESS_DENIED,
  INVALID_JWT,
  JWT_INVALID_ALGORITHM,
} from "../../errors/codes";
import HLRU from "hashlru";
import * as jsonwebtoken from "jsonwebtoken";
import { ParameterizedContext, Next } from "koa";
import { AsymmetricAlgorithm, SymmetricAlgorithm } from "../../types/crypto";
import { isAsymmetricAlgorithm, isSymmetricAlgorithm } from "./crypto";
import { LocallyDefinedSymmetricJwtKey } from "../../types/config";

const createHash: typeof HLRU = require("hashlru");

type CacheItem =
  | { alg: AsymmetricAlgorithm; publicKey: string }
  | { alg: SymmetricAlgorithm; secret: string };

type HLRUCache = {
  has: (key: string | number) => boolean;
  remove: (key: string | number) => void;
  get: (key: string | number) => any;
  set: (key: string | number, value: any) => void;
  clear: () => void;
};

let cache: HLRUCache;

export async function init() {
  const appConfig = config.get();
  cache = createHash(appConfig.jwksCacheSize || 1000);
}

function getItemFromCache(key: string): CacheItem {
  return cache.get(key);
}

export class AuthenticationError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super();
    this.message = message;
    this.code = code;
  }
}

function areParamsForSymmetricAlgorithm(
  params: JwtParameters
): params is JwtParamsForSymmetricAlgorithm {
  return isSymmetricAlgorithm(params.alg);
}

function areParamsForAsymmetricAlgorithm(
  params: JwtParameters
): params is JwtParamsForAsymmetricAlgorithm {
  return isAsymmetricAlgorithm(params.alg);
}

export default function jwksMiddleware(options: { exclude: RegExp[] }) {
  return async (ctx: ParameterizedContext, next: Next): Promise<void> => {
    if (options.exclude.some((regex) => regex.test(ctx.path))) {
      next();
    } else {
      try {
        const jwtParams = await getJwtParameters(ctx);

        if (!(ctx as any).state) {
          ctx.state = {};
        }

        if (areParamsForSymmetricAlgorithm(jwtParams)) {
          ctx.state.jwt = jsonwebtoken.verify(
            jwtParams.token,
            jwtParams.secret,
            {
              algorithms: [jwtParams.alg],
            }
          );
        } else if (areParamsForAsymmetricAlgorithm(jwtParams)) {
          ctx.state.jwt = jsonwebtoken.verify(
            jwtParams.token,
            jwtParams.publicKey,
            {
              algorithms: [jwtParams.alg],
            }
          );
        }
      } catch (ex) {
        if (ex instanceof AuthenticationError) {
          ctx.status = 401;
          ctx.body = {
            success: false,
            error: "Access denied.",
            code: ACCESS_DENIED,
          };
        } else {
          ctx.body = {
            success: false,
            error: "Authentication error.",
            code: ACCESS_DENIED,
          };
        }
      }

      next();
    }
  };
}

type JwtParamsForSymmetricAlgorithm = {
  alg: SymmetricAlgorithm;
  secret: string;
  token: string;
  payload: any;
  signature: string;
};

type JwtParamsForAsymmetricAlgorithm = {
  alg: AsymmetricAlgorithm;
  publicKey: string;
  token: string;
  payload: any;
  signature: string;
};

type JwtParameters =
  | JwtParamsForSymmetricAlgorithm
  | JwtParamsForAsymmetricAlgorithm;

async function getJwtParameters(
  ctx: ParameterizedContext
): Promise<JwtParameters> {
  const token = resolveAuthorizationHeader(ctx);

  if (token === null) {
    throw new AuthenticationError(
      "Authentication error. Missing JWT.",
      INVALID_JWT
    );
  }

  const decodeResult = jsonwebtoken.decode(token, {
    complete: true,
  });

  if (decodeResult === null) {
    throw new AuthenticationError(
      "Authentication error. Missing JWT.",
      INVALID_JWT
    );
  }

  const {
    header: { alg, kid },
    payload,
    signature,
  } = decodeResult as {
    header: { alg: string; kid: string };
    payload: {
      [key: string]: any;
    };
    signature: string;
  };

  const appConfig = config.get();

  if (payload && payload.iss && kid) {
    const issuer: string = payload.iss;
    const issuerIsUrl = issuer.startsWith("http://" || "https://");
    const issuerHostname = issuerIsUrl ? new URL(issuer).hostname : issuer;

    if (issuer) {
      // Check if in allowList/denyList.
      if (appConfig.externalAuthServers.allowList) {
        if (
          ![issuer, issuerHostname].some((x) =>
            appConfig.externalAuthServers.allowList?.includes(x)
          )
        ) {
          throw new AuthenticationError(
            "Authentication Error. Issuer not in allowList.",
            ACCESS_DENIED
          );
        }
      }
      if (appConfig.externalAuthServers.denyList) {
        if (
          [issuer, issuerHostname].some((x) =>
            appConfig.externalAuthServers.denyList?.includes(x)
          )
        ) {
          throw new AuthenticationError(
            "Authentication Error. Issuer is in denyList.",
            ACCESS_DENIED
          );
        }
      }

      // First check if the key is statically defined in appConfig
      if (appConfig.jwtKeys) {
        const signingKey = appConfig.jwtKeys.find(
          (x) => x.issuer === issuer && x.kid === kid && x.alg === alg
        );

        if (signingKey) {
          return {
            ...signingKey,
            token,
            payload,
            signature,
          };
        }
      }

      const cacheKey = `${issuer}::${kid}`;
      const cacheEntry = getItemFromCache(cacheKey);

      if (cacheEntry) {
        if (alg === cacheEntry.alg) {
          return {
            ...cacheEntry,
            token,
            payload,
            signature,
          };
        } else {
          throw new AuthenticationError(
            "Authentication error. Invalid JWT.",
            INVALID_JWT
          );
        }
      } else {
        const issuerWithoutTrailingSlash = issuer.replace(/\/$/, "");
        const issuerUrl = issuerIsUrl
          ? issuerWithoutTrailingSlash
          : "https://" + issuerWithoutTrailingSlash;

        const jwksUri = `${issuerUrl}/.well-known/jwks.json`;

        const client = jwksClient({
          jwksUri,
          requestHeaders: {}, // Optional
          timeout: 30000, // Defaults to 30s
          cache: false,
        });

        const key = await client.getSigningKey(kid);
        if (key.alg === "RS256") {
          const publicKey = key.getPublicKey();
          cache.set(cacheKey, { alg: key.alg, publicKey });
          return { token, alg: "RS256", publicKey, payload, signature };
        } else {
          throw new AuthenticationError(
            "Authentication error. Unsupported signing algorithm.",
            JWT_INVALID_ALGORITHM
          );
        }
      }
    } else {
      throw new AuthenticationError(
        "Authentication error. Invalid JWT.",
        INVALID_JWT
      );
    }
  } else {
    throw new AuthenticationError(
      "Authentication error. Invalid JWT.",
      INVALID_JWT
    );
  }
}

function resolveAuthorizationHeader(ctx: ParameterizedContext): string | null {
  if (!ctx.header || !ctx.header.authorization) {
    return null;
  }

  const parts = ctx.header.authorization.trim().split(" ");

  return parts.length === 2
    ? /^Bearer$/i.test(parts[0])
      ? parts[1]
      : null
    : null;
}
