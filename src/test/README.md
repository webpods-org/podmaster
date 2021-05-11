# Testing WebPods

1. Create the configuration in a directory by running ./create-config /some/path

2. Set up the following env variables first:

```sh
export WEBPODS_TEST_PORT=11666
export WEBPODS_TEST_CONFIG_FILE_PATH=/some/path/config.js
export WEBPODS_TEST_HOSTNAME=some.example.com
export WEBPODS_TEST_DATA_DIR=/some/path/data
```

Then run `npm run build && npm test`.