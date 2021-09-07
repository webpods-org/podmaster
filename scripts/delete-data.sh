set -e

[[ -z "$PODMASTER_TEST_DATA_DIR" ]] && {
  echo "PODMASTER_TEST_DATA_DIR is empty"
  exit 1
}

rm -rf $PODMASTER_TEST_DATA_DIR/podmaster.sqlite
rm -rf $PODMASTER_TEST_DATA_DIR/logs
rm -rf $PODMASTER_TEST_DATA_DIR/pods

mkdir -p $PODMASTER_TEST_DATA_DIR/logs
mkdir -p $PODMASTER_TEST_DATA_DIR/pods