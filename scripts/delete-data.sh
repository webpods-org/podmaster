[[ -z "$PODMASTER_TEST_DATA_DIR" ]] && { echo "PODMASTER_TEST_DATA_DIR is empty" ; exit 1; }

rm $PODMASTER_TEST_DATA_DIR/podmaster.sqlite
rm -rf $PODMASTER_TEST_DATA_DIR/logs
rm -rf $PODMASTER_TEST_DATA_DIR/pods