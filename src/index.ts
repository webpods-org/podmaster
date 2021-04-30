#!/usr/bin/env node

import Koa = require("koa");
import mount = require("koa-mount");
import Router = require("koa-router");
import bodyParser = require("koa-bodyparser");
import yargs = require("yargs");
import { join } from "path";
import { health } from "./api/sys/health";
import * as podsApi from "./api/pods";
import * as logsApi from "./api/logs";

import * as config from "./config";
import { AppConfig } from "./types/config";

const packageJson = require("../package.json");

const argv = yargs.options({
  c: { type: "string", alias: "config" },
  p: { type: "number", default: 8080, alias: "port" },
  v: { type: "boolean", alias: "version" },
}).argv;

export async function startApp(port: number, configDir: string) {
  const appConfig: AppConfig = require(join(configDir, "app.js"));

  // init configuration
  config.init(appConfig);

  // Set up routes
  const router = new Router();

  router.post("/pods", podsApi.createPod);
  router.delete("/pods", podsApi.removePod);
  router.get("/pods/:name/permissions", podsApi.getPermissions);
  router.post("/pods/:name/permissions/updates", podsApi.updatePermissions);
  router.delete("/pods/:name/permissions", podsApi.removePermissions);

  router.post("/logs", logsApi.createLog);
  router.delete("/logs", logsApi.removeLog);
  router.post("/logs/:id/entries", logsApi.addEntries);
  router.get("/logs/:id/permissions", podsApi.getPermissions);
  router.post("/logs/:id/permissions/updates", podsApi.updatePermissions);
  router.delete("/logs/:id/permissions", podsApi.removePermissions);
  
  if (appConfig.streams && appConfig.streams.includes("websocket")) {
    // TODO: Setup web sockets...
  }

  // Start app
  var app = new Koa();
  app.use(bodyParser());
  app.use(router.routes());
  app.use(router.allowedMethods());
  app.listen(port);

  return app;
}

if (require.main === module) {
  // Print the version and exit
  if (argv.v) {
    console.log(packageJson.version);
  } else {
    if (!argv.p) {
      console.log("The port should be specified with the -p option.");
      process.exit(1);
    }

    if (!argv.c) {
      console.log(
        "The configuration directory should be specified with the -c option."
      );
      process.exit(1);
    }

    const configDir = argv.c;
    const port = argv.p;

    startApp(port, configDir);
    console.log(`listening on port ${port}`);
  }
}
