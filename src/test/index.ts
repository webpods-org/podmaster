import "mocha";
import "should";
import integrationTests from "./integrationTests";
import unitTests from "./unitTests";
import * as path from "path";
import { AppConfig } from "../types/config";

function run() {
  /* Sanity check to make sure we don't accidentally run on the server. */
  if (process.env.NODE_ENV !== "development") {
    throw new Error("Tests can only be run with NODE_ENV=development.");
  }

  if (!process.env.WEBPODS_TEST_PORT) {
    throw new Error(
      "The port should be specified in process.env.WEBPODS_TEST_PORT."
    );
  }

  if (!process.env.WEBPODS_TEST_CONFIG_FILE_PATH) {
    throw new Error(
      "The configuration directory should be specified in process.env.WEBPODS_TEST_CONFIG_FILE_PATH."
    );
  }

  if (!process.env.WEBPODS_TEST_HOSTNAME) {
    throw new Error(
      "The hostname should be specified in process.env.WEBPODS_TEST_HOSTNAME."
    );
  }

  if (!process.env.WEBPODS_TEST_DATA_DIR) {
    throw new Error(
      "The data directory should be specified in process.env.WEBPODS_TEST_DATA_DIR."
    );
  }

  const port = parseInt(process.env.WEBPODS_TEST_PORT);
  const configFilePath = process.env.WEBPODS_TEST_CONFIG_FILE_PATH as string;
  const appConfig: AppConfig = require(configFilePath);
  const dbConfig = {
    path: path.join(appConfig.storage.dataDir, "webpodssysdb.sqlite"),
  };

  describe("webpods", () => {
    integrationTests(port, configFilePath, dbConfig);
    // unitTests(configDir, dbConfig);
  });
}

run();
