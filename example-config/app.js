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
  Auth Servers can be these types:
  1. public-key. With a public key predefined.
  2. jwks. By specifying a JWKS standard config.
*/
const authServers = [
  /*
    This allows you to use a JWT created with a locally generated key-pair.
    Provide the name of the issuer (the iss field in the JWT you are generating) and the publicKey here.

    To generate a JWT locally, use a took like jwtgen
    - https://github.com/vandium-io/jwtgen
  */
  {
    type: "public-key",
    issuer: "makeupsomename",
    publicKey: "ASSDF3skdjfh3sldkfhjsdf....",
  },
  /*
    This allows you to use an auth server without a well-known JWKS end point.
    
    if externalAuthServers.allow is set to true (as above), and if the auth server uses a standard (.well-known) jwks.json path, pod-server can automatically fetch it - and the following config is not needed.
  */
  {
    type: "jwks",
    issuer: "auth.example.app",
    jwksUri: "https://example.com/not/standard/path/jwks.json",
  },
];

/*
  Optional issuer allow list.
  By defining this, you'll 
*/

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

  // This is where data for each user is kept.
  // Each user gets an sqlite file.
  dataDir: "/path/to/data/dir",

  // Optional. Whether live streaming updates are enabled.
  // Only websocket is supported as of now.
  // This enables streaming updates for all pods.
  streams: ["websocket"],

  // List of pods hosted by this pod-server
  pods: [
    // Config for alice.
    {
      claims: {
        iss: "https://example.com/auth",
        sub: "alice",
      },

      hostname: "alice.pods.example.com",
      // Optional. Pods can have multiple domain names.
      // Make sure you point webpodsofalice.com to the IP of this pod.
      alias: ["webpodsofalice.com"],

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
        iss: "https://example.com/auth",
        sub: "bob",
      },
      pod: "bob.pods.example.com",
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

  // This is where data for each user is kept.
  // Each user gets an sqlite file.
  dataDir: "/path/to/data/dir",

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
