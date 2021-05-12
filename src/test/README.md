# Testing WebPods

1. Create the configuration in a directory by running ./create-config /some/path

2. Set up the following env variables first:

```sh
export WEBPODS_TEST_PORT="11666"
export WEBPODS_TEST_CONFIG_DIR="/some/path"
export WEBPODS_TEST_HOSTNAME="some.example.com"
export WEBPODS_TEST_JWT_ISSUER="issuer.example.com"
export WEBPODS_TEST_JWT_PUBLIC_KEY="abcdef"
```

3. Point WEBPODS_TEST_HOSTNAME and WEBPODS_TEST_JWT_ISSUER to localhost in /etc/hosts.

Then run `npm run build && npm test`.

