#!/usr/bin/env node

import Koa = require("koa");
import mount = require("koa-mount");
import Router = require("koa-router");
import bodyParser = require("koa-body");
import yargs = require("yargs");
import { join } from "path";
import jwtMiddleware from "./lib/jwt/middleware";
import { init as jwksMiddlewareInit } from "./lib/jwt/middleware";
import * as db from "./db";

import * as podsApi from "./api/pods";
import * as logsApi from "./api/logs";
import * as userApi from "./api/user";
// import * as logsApi from "./api/logs";

import * as config from "./config";
import { AppConfig } from "./types/types";

const packageJson = require("../package.json");

const argv = yargs.options({
  c: { type: "string", alias: "config" },
  p: { type: "number", default: 8080, alias: "port" },
  v: { type: "boolean", alias: "version" },
}).argv;

export async function startApp(port: number, configFile: string) {
  const appConfig: AppConfig = require(configFile);

  await init(appConfig);

  // Set up routes
  const router = new Router();

  // pods
  router.post("/pods", podsApi.createPodAPI);
  router.get("/pods", podsApi.getPodsAPI);

  // logs
  router.get("/logs", logsApi.getLogsAPI);
  router.post("/logs", logsApi.createLogAPI);
  router.get("/logs/:log/entries", logsApi.getEntriesAPI);
  router.post("/logs/:log/entries", logsApi.addEntriesAPI);
  router.get("/logs/:log/permissions", logsApi.getPermissionsAPI);
  router.post("/logs/:log/permissions/updates", logsApi.updatePermissions);

  // Set up a custom hostname
  // router.put("/settings/hostname", podsApi.createPodAPI);
  // router.get("/profile", userApi.getProfile);

  if (appConfig.streams && appConfig.streams.includes("websocket")) {
    // TODO: Setup web sockets...
  }

  // Start app
  var app = new Koa();
  app.use(jwtMiddleware({ exclude: [/^\/\.well-known\//] }));
  app.use(bodyParser());
  app.use(router.routes());
  app.use(router.allowedMethods());
  app.listen(port);

  return app;
}

async function init(appConfig: AppConfig) {
  // init configuration
  // Init everything.
  await config.init(appConfig);
  await db.init();
  await jwksMiddlewareInit();
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
        "The configuration file should be specified with the -c option."
      );
      process.exit(1);
    }

    const configFile = argv.c;
    const port = argv.p;

    startApp(port, configFile);
    console.log(`listening on port ${port}`);
  }
}
