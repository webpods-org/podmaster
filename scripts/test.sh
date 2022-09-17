#!/usr/bin/bash
cd "$(dirname "$0")"
TEMP_DIR=$(mktemp -d 2>/dev/null || mktemp -d -t 'mytmpdir')
echo Using $TEMP_DIR to store data for the test. Will be deleted.
./setup.sh $TEMP_DIR pod1.local.webpods.org ex1.local.webpods.org && PODMASTER_TEST_DATA_DIR=$TEMP_DIR npx mocha --exit ../dist/test/test.js
rm -rf $TEMP_DIR