export type ExternalAuthServers = {
  allow: boolean;
  allowList?: string[];
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
  [key: string]: string;
};

export type PermissionGrant = {
  claims: JwtClaims;
  read?: boolean;
  write?: boolean;
  metadata?: boolean;
  admin?: boolean;
};

export type PodConfig = {
  claims: JwtClaims;
  hostname: string;
  alias?: string[];
  permissions?: PermissionGrant[];
  dataDir: string;
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

export type SelfHostedConfig = {
  mode: "self-hosted";
  hostname: string;
  externalAuthServers: ExternalAuthServers;
  jwksEndpoints?: JwksEndpoint[];
  streams: StreamType[];
  pods: PodConfig[];
  jwks: {
    keys: JWK[];
  };
};

export type SqliteServiceProviderDbConfig = {
  type: "sqlite";
  dbPath: string;
  baseDataDir: string;
  dirNesting: number[];
};

export type ServiceProviderDbConfig = SqliteServiceProviderDbConfig;

export type Tier = {
  type: "free" | "pro";
  maxSpaceMB: number;
  claims: {
    [key: string]: string;
  };
};

export type ServiceProviderConfig = {
  mode: "public";
  hostname: string;
  tiers: Tier[];
  externalAuthServers: ExternalAuthServers;
  jwksEndpoints?: JwksEndpoint[];
  db: ServiceProviderDbConfig;
  streams: StreamType[];
};

export type AppConfig = SelfHostedConfig | ServiceProviderConfig;
