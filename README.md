# Podmaster

Podmaster serves requests to pods according to the [Webpods specification](https://www.webpods.org).

## Installation

```bash
npm i -g podmaster
```

## Creating a configuration file.

See src/example-config

## Running

```bash
podmaster -p PORT -c config-file.mjs
```

## Running Tests

The following will create a config in /some/config/dir.

```bash
./scripts/setup.sh /some/config/dir pod1.local.webpods.org ex1.local.webpods.org
```

You can now run `npm test` after setting the PODMASTER_TEST_DATA_DIR var:

```bash
PODMASTER_TEST_DATA_DIR=/some/config/dir npm test
```

