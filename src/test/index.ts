import "mocha";
import "should";
import integrationTests from "./integrationTests";
import unitTests from "./unitTests";
import * as path from "path";
import { AppConfig } from "../types/config";
import { join } from "path";

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

  if (!process.env.WEBPODS_TEST_CONFIG_DIR) {
    throw new Error(
      "The configuration directory should be specified in process.env.WEBPODS_TEST_CONFIG_DIR."
    );
  }

  if (!process.env.WEBPODS_TEST_HOSTNAME) {
    throw new Error(
      "The hostname should be specified in process.env.WEBPODS_TEST_HOSTNAME."
    );
  }

  const port = parseInt(process.env.WEBPODS_TEST_PORT);
  const configDir = process.env.WEBPODS_TEST_CONFIG_DIR as string;
  const configFilePath = join(configDir, "config");
  const appConfig: AppConfig = require(configFilePath);
  const dbConfig = {
    path: path.join(appConfig.storage.dataDir, "webpodssysdb.sqlite"),
  };

  describe("webpods", () => {
    integrationTests(port, configDir, configFilePath, dbConfig);
    // unitTests(configDir, dbConfig);
  });
}

run();
