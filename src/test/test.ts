import { join } from "path";
import * as path from "path";

import integrationTests from "./integrationTests/index.js";
import { AppConfig } from "../types/types.js";

if (process.env.NODE_ENV !== "development") {
  throw new Error("Tests can only be run with NODE_ENV=development.");
}

for (const envVar of [
  "WEBPODS_TEST_PORT",
  "WEBPODS_TEST_CONFIG_DIR",
  "WEBPODS_TEST_HOSTNAME",
  "WEBPODS_TEST_JWT_ISSUER_HOSTNAME",
  "WEBPODS_TEST_JWT_PUBLIC_KEY",
]) {
  if (!process.env[envVar]) {
    throw new Error(`The process.env.${envVar} should be defined.`);
  }
}

const port = parseInt(process.env.WEBPODS_TEST_PORT as string);
const configDir = process.env.WEBPODS_TEST_CONFIG_DIR as string;
const configFilePath = join(configDir, "config.mjs");

const appConfig: AppConfig = (await import(configFilePath)).default;

const dbConfig = {
  path: path.join(appConfig.storage.dataDir, "webpodssysdb.sqlite"),
};

describe("webpods", () => {
  integrationTests(configDir, configFilePath);
  // unitTests(configDir, dbConfig);
});
