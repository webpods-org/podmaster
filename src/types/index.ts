import { StatusCodes } from "http-status-codes";
import { AsymmetricAlgorithm, KeyTypes, SymmetricAlgorithm } from "./crypto";

export type ExternalAuthServers = {
  allow: boolean;
  allowList?: string[];
  denyList?: string[];
};

export type JwksEndpoint = {
  iss: string;
  url: string;
};

export type PodmasterJwtClaims = {
  iss: string;
  sub: string;
  aud: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  webpods?: {
    namespace: string;
  };
  scope: string;
};

export type PodJwtClaims = {
  iss: string;
  sub: string;
  aud: string | string[];
  scope?: string;
  exp?: number;
  nbf?: number;
  iat?: number;
};

export type PermissionGrant = {
  claims: PodJwtClaims;
  read?: boolean;
  write?: boolean;
  metadata?: boolean;
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

export type StorageConfig = {
  dataDir: string;
  podsDirCount: 100;
  db: {
    type: "sqlite";
  };
};

export type Tier = {
  type: string;
  maxSpaceMB: number;
  maxPodsPerUser?: number;
  claims: {
    [key: string]: unknown;
  };
};

export type LocallyDefinedAsymmetricJwtKey = {
  kid: string;
  kty: "RSA";
  iss: string;
  alg: AsymmetricAlgorithm;
  publicKey: string;
};

export type Identity = {
  iss: string;
  sub: string;
};

export type LimitedPodInfo = {
  id: string;
  name: string;
  app: string;
  hostname: string;
  createdBy: Identity;
  createdAt: number;
  tier: string;
  description: string;
};

export type PodInfo = LimitedPodInfo & {
  permissions?: PermissionGrant[];
};

export type LogInfo = {
  id: string;
  name: string;
  description: string;
  public: boolean;
  createdAt: number;
};

export type HttpsConfig = {
  key: string;
  cert: string;
  ca: string;
};

export type PubSubConfig = {
  maxConnections?: number;
};

export type QueryConfig = {
  maxResults?: number;
};

export type Authenticator = {
  name: string;
  claims: {
    iss: string;
    [key: string]: unknown;
  };
};

export type AppConfig = {
  hostname: string;
  externalAuthServers: ExternalAuthServers;
  jwksEndpoints?: JwksEndpoint[];
  jwksCacheSize?: number;
  localJwtKeys?: LocallyDefinedAsymmetricJwtKey[];
  authenticators: Authenticator[];
  tiers: Tier[];
  storage: StorageConfig;
  pods?: PodInfo[];
  podDbCacheSize?: number;
  maxFileSize?: number;
  useHttps?: HttpsConfig;
  pubsub?: PubSubConfig;
  queries?: QueryConfig;
  requireNamespace?: boolean;
  auth: {
    defaultExpiry?: number;
    keys: {
      kid: string;
      kty: KeyTypes;
      alg: AsymmetricAlgorithm;
      publicKey: string;
      privateKey: string;
    };
  };
};

export type PodScope = "read" | "write";

export type PodAccess = {
  read: boolean;
  write: boolean;
};

export type PodPermission = {
  identity: Identity;
  access: PodAccess;
};

export type LogAccess = {
  read: boolean;
  write: boolean;
  publish: boolean;
  subscribe: boolean;
};

export type LogPermission = {
  log: string;
  identity: Identity;
  access: LogAccess;
};

export type IdentityPermission = {
  identity: Identity;
  pod?: {
    access: PodAccess;
  };
  logs: {
    log: string;
    access: LogAccess;
  }[];
};

export type EntryContentTypes = "data" | "file" | "deleted";

export type LogEntry = {
  id: number;
  contentHash: string;
  commit: string;
  previousCommit: string;
  data: string;
  type: EntryContentTypes;
  iss: string;
  sub: string;
  createdAt: number;
};

export type PermissionToken = {
  id: string;
  permissions: {
    logs: {
      log: string;
      access: LogAccess;
    }[];
  };
  maxRedemptions: number;
  redemptions: number;
  expiry: number;
  createdAt: number;
};

export type HttpError = {
  error: string;
  status: StatusCodes;
};
