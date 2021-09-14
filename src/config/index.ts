import { AppConfig, JWK } from "../types/types.js";
import jose, { JWK as JoseJWK } from "node-jose";

let config: AppConfig;

let podmasterSigningKey: JoseJWK.Key;
let podmasterJWK: JWK;

export async function init(c: AppConfig): Promise<void> {
  config = c;
  podmasterSigningKey = await jose.JWK.asKey(c.auth.keys.publicKey, "pem");
  const key = podmasterSigningKey.toJSON();
  podmasterJWK = {
    ...key,
    kid: c.auth.keys.kid,
    kty: c.auth.keys.kty,
    alg: c.auth.keys.alg,
  } as JWK;
}

export function get(): AppConfig {
  return config;
}

export function getPodmasterSigningKey(): JoseJWK.Key {
  return podmasterSigningKey;
}

export function getPodmasterJWK() {
  return podmasterJWK;
}
