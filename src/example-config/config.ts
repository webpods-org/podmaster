import pathModule from "path";
import fsModule from "fs";

import { AppConfig } from "../types/index.js";

const fs = fsModule;
const path = pathModule;

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
    iss: "https://abc.apple.example.com/",
    url: "https://abc.apple.example.com/oauth2/v3/certs",
  },
];

const config: AppConfig = {
  // Primary host name for this server.
  hostname: "pods.podhost.example.com",

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
  auth: {
    defaultExpiry: 60 * 5, // five mins from now.
    keys: {
      kid: "kid_podmaster",
      kty: "RSA",
      alg: "RS256",
      publicKey: `podmaster-publickey`,
      privateKey: `podmaster-privatekey`,
    },
  },

  /*
    Locally defined JWT keys.
    These do not require a JWKS lookup.
  */
  localJwtKeys: [
    {
      kid: "kid_provider",
      kty: "RSA",
      alg: "RS256",
      iss: "https://auth.podhost.example.com/",
      publicKey: `provider-publickey`,
    },
    {
      kid: "kid_some_other_podmaster",
      kty: "RSA",
      alg: "RS256",
      iss: "https://podzilla.example.com/",
      publicKey: `podzilla-publickey`,
    },
  ],

  /*
    JWTs from these issuers are allowed to create pods on this server
  */
  authenticators: [
    {
      name: "authenticatah",
      claims: {
        iss: "https://auth.podhost.example.com/",
      },
    },
  ],

  // Validate whether provider jwt mentions webpods.namespace claim.
  // If missing and requireNamespace=true, then the create-pod request is rejected.
  // Defauls to true.
  requireNamespace: true,

  /*
    The first match (based on claims) is selected.
    So if you want multiple tiers, include a claim like 'plan'.
  */
  tiers: [
    {
      type: "pro",
      maxSpaceMB: 1024,
      claims: { plan: "pro" },
    },
    {
      type: "free",
      maxSpaceMB: 64,
      maxPodsPerUser: 100,
      claims: {},
    },
  ],

  storage: {
    /*
      This is the base directory which stores all data
      Each user will get a directory under this.
      Exact path will depend on the dirNesting option.
    */
    dataDir: "/path/to/data/dir",

    /*
      Max numbered directories to use for pod storage.
      A count of 100 means that the pods directory will have:
      pods/1/..., pods/2/... up to pods/100/...      
    */
    podsDirCount: 100,

    // Only sqlite is supported now.
    db: {
      type: "sqlite",
    },
  },

  pubsub: {
    maxConnections: 10000,
  },

  queries: {
    maxResults: 200,
  },

  /*
    Optional HTTPS config
  */
  // useHttps: {
  //   key: "key...",
  //   cert: "cert..",
  //   ca: "ca...",
  // },
};

/* 
  This is where you export a config based on whether
  this is a self-hosted pod server, or you're a service provider.  
  Set this accordingly.  
*/
export default config;
