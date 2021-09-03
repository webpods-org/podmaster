import Koa from "koa";
import Router from "koa-router";
import bodyParser from "koa-body";
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
import * as wellKnownEndpoints from "./api/well-known/index.js";

const MEGABYTE = 1024 * 1024;

export default async function startApp(configFile: string) {
  const appConfig: AppConfig = (await import(configFile)).default;

  await init(appConfig);

  // Set up routes
  const router = new Router();

  // podmaster
  router.post("/pods", podsApi.createPodAPI);
  router.get("/pods", podsApi.getPodsAPI);

  // pods
  router.get("/permissions", podsApi.getPermissionsAPI);
  router.post("/permissions/updates", podsApi.updatePermissions);

  // logs
  router.get("/logs", logsApi.getLogsAPI);
  router.post("/logs", logsApi.createLogAPI);
  router.get("/logs/:log/info", logsApi.getInfoAPI);
  router.get("/logs/:log/entries", logsApi.getEntriesAPI);
  router.post("/logs/:log/entries", logsApi.addEntriesAPI);
  router.get("/logs/:log/permissions", logsApi.getPermissionsAPI);
  router.post("/logs/:log/permissions/updates", logsApi.updatePermissions);
  router.get("/logs/:log/files/(.*)", logsApi.getFile);

  //.well-known
  router.get("/.well-known/jwks.json", wellKnownEndpoints.getJwks);

  // Set up a custom hostname
  // router.put("/settings/hostname", podsApi.createPodAPI);
  // router.get("/profile", userApi.getProfile);

  // Setup Koa
  const koa = new Koa();
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
