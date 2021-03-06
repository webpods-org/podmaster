import { join } from "path";

import integrationTests from "./integrationTests/index.js";
import { AppConfig } from "../types/index.js";

if (process.env.NODE_ENV !== "development") {
  throw new Error("Tests can only be run with NODE_ENV=development.");
}

for (const envVar of ["PODMASTER_TEST_DATA_DIR"]) {
  if (!process.env[envVar]) {
    throw new Error(`The process.env.${envVar} should be defined.`);
  }
}

const configDir = process.env.PODMASTER_TEST_DATA_DIR as string;
const configFilePath = join(configDir, "config.mjs");

const appConfig: AppConfig = (await import(configFilePath)).default;

describe("webpods", () => {
  integrationTests(configDir, configFilePath);
});
