import jwksClient = require("jwks-rsa");
import * as config from "../../config";
import {
  ACCESS_DENIED,
  INVALID_JWT,
  JWT_INVALID_ALGORITHM,
} from "../../errors/codes";
import * as jsonwebtoken from "jsonwebtoken";
import { ParameterizedContext, Next } from "koa";
import { AsymmetricAlgorithm } from "../../types/crypto";
import { LRUMap } from "../lruCache/lru";
import { Result } from "../../types/api";

// Only this for now.
const supportedAlgorithms: string[] = ["RS256"];

type CacheItem = { alg: AsymmetricAlgorithm; publicKey: string };

let cache: LRUMap<string, CacheItem>;

export async function init() {
  const appConfig = config.get();
  cache = new LRUMap(appConfig.jwksCacheSize || 1000);
}

function getItemFromCache(key: string): CacheItem | undefined {
  return cache.find(key);
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
      if (!(ctx as any).state) {
        ctx.state = {};
      }

      try {
        const jwtParams = await getJwtParameters(ctx);

        if (jwtParams.ok) {
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
        } else {
          console.log(jwtParams);
        }

        return next();
      } catch (ex) {
        console.log(ex);
      }
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
): Promise<Result<JwtParamsForAsymmetricAlgorithm>> {
  const token = resolveAuthorizationHeader(ctx);

  if (token === null) {
    return {
      ok: false,
      error: "Authentication error. Missing JWT.",
      code: INVALID_JWT,
    };
  }

  const decodeResult = jsonwebtoken.decode(token, {
    complete: true,
  });

  if (decodeResult === null) {
    return {
      ok: false,
      error: "Authentication error. Missing JWT.",
      code: INVALID_JWT,
    };
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
    return {
      ok: false,
      error: `Authentication error. Unsupported algorithm ${alg}.`,
      code: JWT_INVALID_ALGORITHM,
    };
  }

  const appConfig = config.get();

  const { iss, kid } = payload;
  if (payload && iss && kid) {
    const issuerIsUrl = iss.startsWith("http://" || "https://");
    const issuerHostname = issuerIsUrl ? new URL(iss).hostname : iss;

    if (iss) {
      // Check if in allowList/denyList.
      if (appConfig.externalAuthServers.allowList) {
        if (
          ![iss, issuerHostname].some((x) =>
            appConfig.externalAuthServers.allowList?.includes(x)
          )
        ) {
          return {
            ok: false,
            error: "Authentication Error. Issuer not in allowList.",
            code: ACCESS_DENIED,
          };
        }
      }
      if (appConfig.externalAuthServers.denyList) {
        if (
          [iss, issuerHostname].some((x) =>
            appConfig.externalAuthServers.denyList?.includes(x)
          )
        ) {
          return {
            ok: false,
            error: "Authentication Error. Issuer is in denyList.",
            code: ACCESS_DENIED,
          };
        }
      }

      // First check if the key is statically defined in appConfig
      if (appConfig.jwtKeys) {
        const signingKey = appConfig.jwtKeys.find(
          (x) => x.iss === iss && x.kid === kid && x.alg === alg
        );

        if (signingKey) {
          return {
            ok: true,
            ...signingKey,
            token,
            payload,
            signature,
          };
        }
      }

      const cacheKey = `${iss}::${kid}`;
      const cacheEntry = getItemFromCache(cacheKey);

      if (cacheEntry) {
        if (alg === cacheEntry.alg) {
          return {
            ok: true,
            ...cacheEntry,
            token,
            payload,
            signature,
          };
        } else {
          return {
            ok: false,
            error: "Authentication error. Invalid JWT.",
            code: INVALID_JWT,
          };
        }
      } else {
        const issuerWithoutTrailingSlash = iss.replace(/\/$/, "");
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
          cache.set(cacheKey, {
            alg: key.alg as AsymmetricAlgorithm,
            publicKey,
          });
          return {
            ok: true,
            token,
            alg: key.alg as AsymmetricAlgorithm,
            publicKey,
            payload,
            signature,
          };
        } else {
          return {
            ok: false,
            error: `Authentication error. Unsupported algorithm ${key.alg}.`,
            code: JWT_INVALID_ALGORITHM,
          };
        }
      }
    } else {
      return {
        ok: false,
        error: "Authentication error. Invalid JWT.",
        code: INVALID_JWT,
      };
    }
  } else {
    return {
      ok: false,
      error: "Authentication error. Invalid JWT.",
      code: INVALID_JWT,
    };
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
