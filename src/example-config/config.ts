import { AppConfig } from "../types/config";

/*
  This is required if you want to allow external parties to READ your pods.
  Usually needed, since your friends or peers could be using extenral authServers. If all the users of this pod service (readers and writers) are local (and you need this restriction), then set this to false.

  Defaults to true, for the above reasons.
*/
const externalAuthServers = {
  allow: true,

  /*
    Optional. But if defined limits issuer hostnames
    to those in this list.
  */
  // allowList: ["azure.com", "example.com", "auth0.com"],

  /*
    Optional. But if defined, disallows issuer urls
    with these hostnames.
  */
  // denyList: ["azure.com", "example.com", "auth0.com"]
};

/*
  Optional. If the JWKS endpoint is non-standard,
  it can be overridden with this.
*/
const jwksEndpoints = [
  {
    type: "jwks" as const,
    issuer: "https://abc.example.com",
    url: "https://example.com/oauth2/v3/certs",
  },
];

const config: AppConfig = {
  // Primary host name for this server.
  hostname: "pods.example.com",

  // External Auth Server config created earlier.
  externalAuthServers,

  // Optional. JWKS endpoint overrides
  jwksEndpoints,

  /*
    Optional JWKS configuration:
    - This data is exposed at https://{hostname}/.well-known/jwks.json
    - It is useful if you're using self-generated keys.
    - eg: When alice connects to external pods, they will expect the
      JWKS to be at {iss}/.well-known/jwks.json
  */
  jwks: {
    keys: [
      {
        kty: "RSA",
        n: "xYm1YQ....dC9pyw",
        kid: "de9556ad4680312c117afaef2920f5f99a4c79fd",
        use: "sig",
        alg: "RS256",
        e: "AQAB",
      },
    ],
  },

  /*
    Locally defined JWT keys.
    These do not require a JWKS lookup.
    Supports symmetric and asymmetric algos.
    Asymmetric is strongly recommended.
  */
  jwtKeys: [
    {
      alg: "HS256",
      issuer: "https://example.com",
      kid: "007",
      secret: "mysecretkey",
    },
  ],

  /*
    Which JWTs can create a pod on this pod-server?
    Any JWT which matches one of these is allowed to.
    So include the 'iss' field at a minimum.

    In the following example, the usage tier is identified by the 'plan' claim.
  */
  tiers: [
    {
      type: "free",
      maxSpaceMB: 64,
      claims: {
        iss: "https://auth.example.com/",
        plan: "free",
      },
    },
    {
      type: "pro",
      maxSpaceMB: 1024,
      claims: {
        iss: "https://auth.example.com/",
        plan: "pro",
      },
    },
  ],

  // Only sqlite is supported now.
  storage: {
    type: "sqlite",
    /*
      This is the base directory which stores all data
      Each user will get a directory under this.
      Exact path will depend on the dirNesting option.
    */
    dataDir: "/path/to/data/dir",

    /*
      Number of directory levels to use for storage.
      [n1, n2] means first level has n1, second has n2
      [100, 100] means 100 dirs in dataDir, and 100 in each of them.
      Number goes n1, n2 etc.
    */
    dirNesting: [100, 100],
  },

  /*
    Optional. Whether live streaming updates are enabled.
    Only websocket is supported as of now.
    This enables streaming updates for all pods.
  */
  streams: ["websocket"],
};

/* 
  This is where you export a config based on whether
  this is a self-hosted pod server, or you're a service provider.  
  Set this accordingly.  
*/
module.exports = config;
