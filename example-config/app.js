/*
  This is required if you want to allow external parties to READ your pods.
  Usually needed, since your friends or peers might be using extenral authServers. If all the users of this pod service (readers and writers) are local (and you need increased security), then set this to false.

  Defaults to true, for the above reasons.
*/
const externalAuthServers = {
  allow: true,

  /* This is optional, but if defined limits issuers to those in this list. */
  // allowList: ["azure.com", "example.com", "auth0.com"]
};

/*
  Optional. Only 'jwks' override is supported now.:
    1. jwks. By specifying a JWKS standard config.
*/
const authServers = [
  /*
    This allows you to use an auth server without a well-known JWKS end point.
    
    if externalAuthServers.allow is set to true (as above), and if the auth server uses a standard (.well-known) jwks.json path, pod-server can automatically fetch it - and the following config is not needed.
  */
  {
    type: "jwks",
    issuer: "auth.google.app",
    url: "https://www.googleapis.com/oauth2/v3/certs",
  },
];

/*
  We can define two types of configs. You must use only one of these.
  1. local: If you're self-hosting a pod-server for yourself, friends and family. Pod creation will be restricted to the users defined in this file.
  2. public: If you're running a commercial pod service, which allows people to sign up. Users who sign up will be able to create a pod.

  Export the relevant config as module.exports at the end of the file.
*/

/*
  For self hosting: If you're running this server for yourself, friends and family. Pod creation will be restricted to the users defined in this file.
*/
const selfHostingConfig = {
  mode: "local",

  // Primary host name for this server.
  hostname: "pods.example.com",

  // External Auth Server config created earlier.
  externalAuthServers,

  // Optional. Whether live streaming updates are enabled.
  // Only websocket is supported as of now.
  // This enables streaming updates for all pods.
  streams: ["websocket"],

  // JWKS configuration for self-hosted pods:
  // - This is exposed at https://{hostname}/.well-known/jwks.json
  // - When alice connects to external pods, they will expect the
  //   JWKS to be at {iss}/.well-known/jwks.json
  // - So it's important that when alice creates a JWT for herself,
  //   the iss claim should match the 'hostname' specified earlier.
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

  // List of pods hosted by this pod-server
  pods: [
    // Config for alice.
    {
      // Claims which identify alice.
      claims: {
        iss: "https://pods.example.com",
        sub: "alice",
      },

      // primary hostname for the pod.
      hostname: "alice.pods.example.com",

      // Optional. Pods can have multiple domain names.
      // Make sure you point webpodsofalice.com to the IP of this pod.
      alias: ["webpodsofalice.com"],

      // Where alice's data is kept
      dataDir: "/path/to/data/dir/alice",

      // Permissions to apply to all logs on a pod.
      // This grants read access to carol for all logs.
      permissions: [
        {
          // identifier for JWT
          claims: {
            iss: "https://example.com/auth",
            sub: "carol",
          },

          // All are optional.
          // Defaults to false when omitted.
          read: true, // read log
          write: false, // write to log
          admin: false, // r+w & change permissions
        },
      ],
    },
    // Config for bob.
    {
      claims: {
        iss: "https://pods.example.com",
        sub: "bob",
      },
      hostname: "alice.pods.example.com",

      // Where bob's data is kept
      dataDir: "/path/to/data/dir/bob",
    },
  ],
};

/*
  For service providers: If you're running a commercial pod service, which allows people to sign up. Users who sign up will be able to create a pod.

  We do not define pod-specific configuration here. That'll be in the database.
*/
const serviceProviderConfig = {
  mode: "public",

  // Primary host name for this server.
  hostname: "pods.example.com",

  // External Auth Server config created earlier.
  externalAuthServers,

  // Path to sqlite file.
  // This is where information about users is kept.
  dbPath: "/some/path/to/db",

  // This is the base directory which stores all data
  // Each user will get a directory under this.
  // Exact path will depend on the dirNesting option.
  baseDataDir: "/path/to/data/dir",

  // Number of directory levels to use for storage.
  // [n1, n2] means first level has n1, second has n2
  // [100, 100] means 100 dirs in dataDir, and 100 in each of them.
  // Number goes n1, n2 etc.
  dirNesting: [100, 100],

  // Optional. Whether live streaming updates are enabled.
  // Only websocket is supported as of now.
  // This enables streaming updates for all pods.
  streams: ["websocket"],
};

/* 
  This is where you export a config based on whether
  this is a self-hosted pod server, or you're a service provider.  
  Set this accordingly.  
*/
module.exports = selfHostingConfig;
