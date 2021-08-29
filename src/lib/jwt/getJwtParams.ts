import * as jsonwebtoken from "jsonwebtoken";
import jwksClient from "jwks-rsa";

import * as config from "../../config/index.js";
import {
  ACCESS_DENIED,
  INVALID_JWT,
  JWT_INVALID_ALGORITHM,
} from "../../errors/codes.js";
import { AsymmetricAlgorithm } from "../../types/crypto.js";
import { LRUMap } from "../lruCache/lru.js";
import { Result } from "../../types/api.js";

// Only this for now.
const supportedAlgorithms: string[] = ["RS256"];

type CacheItem = { alg: AsymmetricAlgorithm; publicKey: string };

let cache: LRUMap<string, CacheItem>;

export type JwtParamsForAsymmetricAlgorithm = {
  alg: AsymmetricAlgorithm;
  publicKey: string;
  token: string;
  payload: any;
  signature: string;
};

export async function init(): Promise<void> {
  const appConfig = config.get();
  cache = new LRUMap(appConfig.jwksCacheSize || 1000);
}

function getItemFromCache(key: string): CacheItem | undefined {
  return cache.find(key);
}

export default async function getJwtParams(
  token: string
): Promise<Result<JwtParamsForAsymmetricAlgorithm>> {
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
            value: { ...signingKey, token, payload, signature },
          };
        }
      }

      const cacheKey = `${iss}::${kid}`;
      const cacheEntry = getItemFromCache(cacheKey);

      if (cacheEntry) {
        if (alg === cacheEntry.alg) {
          return {
            ok: true,
            value: { ...cacheEntry, token, payload, signature },
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
            value: {
              token,
              alg: key.alg as AsymmetricAlgorithm,
              publicKey,
              payload,
              signature,
            },
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
