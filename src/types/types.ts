import { AsymmetricAlgorithm, SymmetricAlgorithm } from "./crypto";

export type ExternalAuthServers = {
  allow: boolean;
  allowList?: string[];
  denyList?: string[];
};

export type JwksEndpoint = {
  type: "jwks";
  issuer: string;
  url: string;
};

export type StreamType = "websocket";

export type JwtClaims = {
  iss: string;
  sub: string;
  webpods?: {
    hostname: string;
    pod: string;
  };
  [key: string]: unknown;
};

export type PermissionGrant = {
  claims: JwtClaims;
  read?: boolean;
  write?: boolean;
  metadata?: boolean;
  admin?: boolean;
};

export type JWK = {
  alg: string;
  kty: string;
  use: string;
  n?: string;
  e?: string;
  kid: string;
  x5t?: string;
  x5c?: string[];
};

export type SqliteStorageConfig = {
  type: "sqlite";
  dataDir: string;
  dirNesting: number[];
};

export type StorageConfig = SqliteStorageConfig;

export type Tier = {
  type: string;
  maxSpaceMB: number;
  claims: {
    [key: string]: unknown;
  };
};

export type LocallyDefinedAsymmetricJwtKey = {
  kid: string;
  issuer: string;
  alg: AsymmetricAlgorithm;
  publicKey: string;
};

export type PodInfo = {
  issuer: string;
  username: string;
  pod: string;
  hostname: string;
  hostnameAlias: string | null;
  createdAt: number;
  dataDir: string;
  tier: string;
  permissions?: PermissionGrant[];
};

export type LogInfo = {
  pod: string;
  log: string;
  createdAt: number;
  tags: string | null;
};

export type AppConfig = {
  hostname: string;
  externalAuthServers: ExternalAuthServers;
  jwksEndpoints?: JwksEndpoint[];
  jwks: {
    keys: JWK[];
  };
  jwksCacheSize?: number;
  jwtKeys?: LocallyDefinedAsymmetricJwtKey[];
  streams: StreamType[];
  tiers: Tier[];
  storage: StorageConfig;
  pods?: PodInfo[];
  podDbCacheSize?: number;
};
