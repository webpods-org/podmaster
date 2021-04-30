export type ExternalAuthServers = {
  allow: boolean;
  allowList?: string[];
};

export type AuthServer =
  | {
      type: "public-key";
      issuer: string;
      publicKey: string;
    }
  | {
      type: "jwks";
      issuer: string;
      jwksUri: string;
    };

export type StreamType = "websocket";

export type Claims = {
  [key: string]: string;
};

export type PermissionGrant = {
  claims: Claims;
  read?: boolean;
  write?: boolean;
  admin?: boolean;
};

export type PodConfig = {
  claims: Claims;
  hostname: string;
  alias?: string[];
  permissions: PermissionGrant[];
  dataDir: string;
};

export type JWK = {
  alg: string;
  kty: string;
  use: string;
  n: string;
  e: string;
  kid: string;
  x5t: string;
  x5c: string[];
};

export type LocalConfig = {
  mode: "local";
  hostname: string;
  externalAuthServers: ExternalAuthServers;
  dataDir: string;
  streams: StreamType[];
  pods: PodConfig[];
  jwks: {
    keys: JWK[];
  };
};

export type ServiceProviderConfig = {
  mode: "public";
  hostname: string;
  externalAuthServers: ExternalAuthServers;
  dbPath: string;
  baseDataDir: string;
  streams: StreamType[];
};

export type AppConfig = LocalConfig | ServiceProviderConfig;
