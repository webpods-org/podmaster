import jwksClient from "jwks-rsa";
import * as config from "../../config";
import { ACCESS_DENIED, INVALID_JWT } from "../../errors/codes";
import LRU from "quick-lru";
import * as jsonwebtoken from "jsonwebtoken";
import { ExtendableContext, Next } from "koa";

let cache: LRU<string, { alg: string; publicKey: string }>;

export async function init() {
  const appConfig = config.get();
  cache = new LRU<string, { alg: string; publicKey: string }>({
    maxSize: appConfig.jwksCacheSize || 1000,
  });
}

export class AuthenticationError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super();
    this.message = message;
    this.code = code;
  }
}

export default async function jwksMiddleware(
  ctx: ExtendableContext,
  next: Next
): Promise<void> {
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
  } = decodeResult;

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
          return validateWithKey(alg, signingKey.publicKey);
        }
      }

      const cacheKey = `${issuer}::${kid}`;
      const cacheEntry = cache.get(cacheKey);

      if (cacheEntry) {
        if (alg === cacheEntry.alg) {
          return validateWithKey(alg, cacheEntry.publicKey);
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
        const publicKey = key.getPublicKey();
        cache.set(cacheKey, { alg: key.alg, publicKey });
        
        validateWithKey(alg, publicKey);
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

function validateWithKey(alg: string, publicKey: string) {}

function resolveAuthorizationHeader(ctx: ExtendableContext): string | null {
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
