import jsonwebtoken from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import * as config from "../../config/index.js";
import { AsymmetricAlgorithm, KeyTypes } from "../../types/crypto.js";
import { LRUMap } from "../lruCache/lru.js";
import { asymmetricAlgorithms, getKeyType } from "./crypto.js";
import { InvalidResult, ValidResult } from "../../Result.js";

type CacheItem = {
  kid: string;
  kty: KeyTypes | "UNKNOWN";
  alg: AsymmetricAlgorithm;
  publicKey: string;
};

let cache: LRUMap<string, CacheItem>;

export type JWKInfo = {
  kid: string;
  kty: KeyTypes | "UNKNOWN";
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

export default async function getJwtValidationParams(
  token: string
): Promise<
  | ValidResult<JWKInfo>
  | InvalidResult<
      | "INVALID_JWT"
      | "INVALID_ALGORITHM"
      | "INVALID_PAYLOAD"
      | "MISSING_ISS"
      | "MISSING_KID"
      | "UNKNOWN_ISSUER"
      | "BLOCKED_ISSUER"
    >
> {
  const decodeResult = jsonwebtoken.decode(token, {
    complete: true,
  });

  if (decodeResult === null) {
    return new InvalidResult("INVALID_JWT");
  }

  const { header, payload, signature } = decodeResult as {
    header: { alg: string; type: "JWT"; kid: string };
    payload: {
      iss: string;
      [key: string]: any;
    };
    signature: string;
  };

  const { alg, kid } = header;
  const { iss } = payload;

  //
  if (!asymmetricAlgorithms.includes(alg.toUpperCase())) {
    return new InvalidResult("INVALID_ALGORITHM");
  }

  const appConfig = config.get();

  if (!payload) {
    return new InvalidResult("INVALID_PAYLOAD");
  }

  if (!iss) {
    return new InvalidResult("MISSING_ISS");
  }

  if (!kid) {
    return new InvalidResult("MISSING_KID");
  }

  const issuerIsUrl = iss.startsWith("http://") || iss.startsWith("https://");
  const issuerHostname = issuerIsUrl ? new URL(iss).hostname : iss;

  // Check if in allowList/denyList.
  if (appConfig.externalAuthServers.allowList) {
    if (
      ![iss, issuerHostname].some((x) =>
        appConfig.externalAuthServers.allowList?.includes(x)
      )
    ) {
      return new InvalidResult("UNKNOWN_ISSUER");
    }
  }
  if (appConfig.externalAuthServers.denyList) {
    if (
      [iss, issuerHostname].some((x) =>
        appConfig.externalAuthServers.denyList?.includes(x)
      )
    ) {
      return new InvalidResult("BLOCKED_ISSUER");
    }
  }

  // First check if:
  // a) this was issued by a pod, OR
  // b) if the key is statically defined in appConfig
  const issuerIsPod = issuerHostname === appConfig.hostname;
  if (issuerIsPod && kid === appConfig.auth.keys.kid) {
    return new ValidResult({
      kid: appConfig.auth.keys.kid,
      kty: appConfig.auth.keys.kty,
      alg: appConfig.auth.keys.alg,
      publicKey: appConfig.auth.keys.publicKey,
      token,
      payload,
      signature,
    });
  } else if (appConfig.localJwtKeys) {
    const signingKey = appConfig.localJwtKeys.find(
      (x) => x.iss === iss && x.kid === kid && x.alg === alg
    );

    if (signingKey) {
      return new ValidResult({
        ...signingKey,
        token,
        payload,
        signature,
      });
    }
  }

  const cacheKey = `${iss}::${kid}`;
  const cacheEntry = getItemFromCache(cacheKey);

  if (cacheEntry) {
    if (alg === cacheEntry.alg) {
      return new ValidResult({
        ...cacheEntry,
        token,
        payload,
        signature,
      });
    } else {
      return new InvalidResult("INVALID_ALGORITHM");
    }
  } else {
    // First check if we have JWKS endpoint override.
    const overriddenEndpoint = appConfig.jwksEndpoints?.find(
      (x) => x.iss === iss
    );

    const jwksUri = overriddenEndpoint
      ? overriddenEndpoint.url
      : `https://${new URL(iss).hostname}/.well-known/jwks.json`;

    const client = jwksClient({
      jwksUri,
      requestHeaders: {}, // Optional
      timeout: 30000, // Defaults to 30s
      cache: false,
    });

    const key = await client.getSigningKey(kid);

    if (asymmetricAlgorithms.includes(key.alg.toUpperCase())) {
      const publicKey = key.getPublicKey();
      cache.set(cacheKey, {
        kid: key.kid,
        kty: getKeyType(key.alg),
        alg: key.alg as AsymmetricAlgorithm,
        publicKey,
      });
      return new ValidResult({
        token,
        kid: key.kid,
        kty: getKeyType(key.alg),
        alg: key.alg as AsymmetricAlgorithm,
        publicKey,
        payload,
        signature,
      });
    } else {
      return new InvalidResult("INVALID_ALGORITHM");
    }
  }
}
