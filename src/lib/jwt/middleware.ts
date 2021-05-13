import jwksClient = require("jwks-rsa");
import * as config from "../../config";
import {
  ACCESS_DENIED,
  INVALID_JWT,
  JWT_INVALID_ALGORITHM,
} from "../../errors/codes";
import HLRU from "hashlru";
import * as jsonwebtoken from "jsonwebtoken";
import { ParameterizedContext, Next } from "koa";
import { AsymmetricAlgorithm } from "../../types/crypto";

const createHash: typeof HLRU = require("hashlru");

// Only this for now.
const supportedAlgorithms: string[] = ["RS256"];

type CacheItem = { alg: AsymmetricAlgorithm; publicKey: string };

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

export default function jwtMiddleware(options: { exclude: RegExp[] }) {
  return async (ctx: ParameterizedContext, next: Next): Promise<void> => {
    if (options.exclude.some((regex) => regex.test(ctx.path))) {
      next();
    } else {
      try {
        const jwtParams = await getJwtParameters(ctx);

        if (!(ctx as any).state) {
          ctx.state = {};
        }

        const claims = jsonwebtoken.verify(
          jwtParams.token,
          jwtParams.publicKey,
          {
            algorithms: [jwtParams.alg],
          }
        );
        
        ctx.state.jwt = {
          claims,
        };
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

type JwtParamsForAsymmetricAlgorithm = {
  alg: AsymmetricAlgorithm;
  publicKey: string;
  token: string;
  payload: any;
  signature: string;
};

async function getJwtParameters(
  ctx: ParameterizedContext
): Promise<JwtParamsForAsymmetricAlgorithm> {
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
    header: { alg },
    payload,
    signature,
  } = decodeResult as {
    header: { alg: string; type: "JWT" };
    payload: {
      kid: string;
      iss: string;
      [key: string]: any;
    };
    signature: string;
  };

  //
  if (!supportedAlgorithms.includes(alg.toUpperCase())) {
    throw new AuthenticationError(
      `Authentication error. Unsupported algorithm ${alg}.`,
      JWT_INVALID_ALGORITHM
    );
  }

  const appConfig = config.get();

  const { iss: issuer, kid } = payload;
  if (payload && issuer && kid) {
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
        if (supportedAlgorithms.includes(key.alg.toUpperCase())) {
          const publicKey = key.getPublicKey();
          cache.set(cacheKey, { alg: key.alg, publicKey });
          return {
            token,
            alg: key.alg as AsymmetricAlgorithm,
            publicKey,
            payload,
            signature,
          };
        } else {
          throw new AuthenticationError(
            `Authentication error. Unsupported algorithm ${key.alg}.`,
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

function removeTrailingSlash(str: string) {
  return str.replace(/\/$/, "");
}
