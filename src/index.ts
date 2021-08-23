#!/usr/bin/env node

import Koa from "koa";
import Router from "koa-router";
import bodyParser from "koa-body";
import yargs from "yargs";
import * as path from "path";
import * as fs from "fs";

import jwtMiddleware from "./lib/jwt/middleware.js";
import { init as libJwtInit } from "./lib/jwt/getJwtParams.js";
import * as db from "./db/index.js";
import { init as loggerInit } from "./lib/logger/log.js";

import * as podsApi from "./api/pods/index.js";
import * as logsApi from "./api/logs/index.js";

import * as config from "./config/index.js";
import { AppConfig } from "./types/types.js";
import { createHttpServer } from "./lib/servers/http.js";
import { attachWebSocketServer } from "./lib/servers/webSocket.js";

const packageJson = require("../package.json");

const argv = yargs.options({
  c: { type: "string", alias: "config" },
  p: { type: "number", default: 8080, alias: "port" },
  v: { type: "boolean", alias: "version" },
}).argv;

const MEGABYTE = 1024 * 1024;

export async function startApp(configFile: string) {
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
  router.get("/logs/:log/info", logsApi.getInfoAPI);
  router.get("/logs/:log/entries", logsApi.getEntriesAPI);
  router.post("/logs/:log/entries", logsApi.addEntriesAPI);
  router.get("/logs/:log/permissions", logsApi.getPermissionsAPI);
  router.post("/logs/:log/permissions/updates", logsApi.updatePermissions);
  router.get("/logs/:log/files/(.*)", logsApi.getFile);

  // Set up a custom hostname
  // router.put("/settings/hostname", podsApi.createPodAPI);
  // router.get("/profile", userApi.getProfile);

  // Setup Koa
  var koa = new Koa();
  koa.use(jwtMiddleware({ exclude: [/^\/\.well-known\//, /^\/channels$/] }));
  koa.use(
    bodyParser({
      multipart: true,
      formidable: { maxFieldsSize: appConfig.maxFileSize || 8 * MEGABYTE },
    })
  );
  koa.use(router.routes());
  koa.use(router.allowedMethods());

  const koaCallback = koa.callback();

  const server = createHttpServer(koaCallback, appConfig);

  // Attach websocket server only if pubsub is enabled.
  if (appConfig.pubsub) {
    attachWebSocketServer(server, appConfig);
  }
  return server;
}

async function init(appConfig: AppConfig) {
  // init configuration
  // Init everything.
  await config.init(appConfig);
  await db.init();
  await libJwtInit();
  await loggerInit();
}

if (require.main === module) {
  // Print the version and exit
  if (argv.v) {
    const pkg = path.join(__dirname, "../package.json");
    const packageJSON = JSON.parse(fs.readFileSync(pkg, "utf8"));
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

    startApp(configFile).then((server) => {
      server.listen(port);
      console.log(`listening on port ${port}`);
    });
  }
}
