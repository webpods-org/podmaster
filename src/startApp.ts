import Koa from "koa";
import Router from "koa-router";
import bodyParser from "koa-body";
import jwtMiddleware from "./lib/jwt/middleware.js";
import { init as libJwtInit } from "./lib/jwt/getJwtParams.js";
import * as db from "./db/index.js";
import { init as loggerInit } from "./lib/logger/log.js";

import * as podsApi from "./api/podmaster/pods/index.js";
import * as logsApi from "./api/pod/logs/index.js";

import * as config from "./config/index.js";
import { AppConfig } from "./types/types.js";
import { createHttpServer } from "./lib/servers/http.js";
import { attachWebSocketServer } from "./lib/servers/webSocket.js";
import * as wellKnownEndpoints from "./api/podmaster/well-known/index.js";
import { IncomingMessage, OutgoingMessage, ServerResponse } from "http";
import { Http2ServerRequest, Http2ServerResponse } from "http2";

const MEGABYTE = 1024 * 1024;

export default async function startApp(configFile: string) {
  const appConfig: AppConfig = (await import(configFile)).default;

  await init(appConfig);

  // Set up a custom hostname
  // router.put("/settings/hostname", podsApi.createPodAPI);
  // router.get("/profile", userApi.getProfile);

  /* POD MASTER ROUTES*/
  const podMasterRouter = new Router();

  podMasterRouter.post("/pods", podsApi.createPodAPI);
  podMasterRouter.get("/pods", podsApi.getPodsAPI);
  //.well-known
  podMasterRouter.get("/.well-known/jwks.json", wellKnownEndpoints.getJwks);

  const koaPodmaster = new Koa();
  koaPodmaster.use(jwtMiddleware({ exclude: [/^\/\.well-known\//] }));
  koaPodmaster.use(
    bodyParser({
      multipart: true,
      formidable: { maxFieldsSize: appConfig.maxFileSize || 8 * MEGABYTE },
    })
  );
  koaPodmaster.use(podMasterRouter.routes());
  koaPodmaster.use(podMasterRouter.allowedMethods());
  const podmasterCallback = koaPodmaster.callback();

  /* POD ROUTES */
  const podsRouter = new Router();
  podsRouter.get("/permissions", podsApi.getPermissionsAPI);
  podsRouter.post("/permissions/updates", podsApi.updatePermissions);

  // logs
  podsRouter.get("/logs", logsApi.getLogsAPI);
  podsRouter.post("/logs", logsApi.createLogAPI);
  podsRouter.get("/logs/:log/info", logsApi.getInfoAPI);
  podsRouter.get("/logs/:log/entries", logsApi.getEntriesAPI);
  podsRouter.post("/logs/:log/entries", logsApi.addEntriesAPI);
  podsRouter.get("/logs/:log/permissions", logsApi.getPermissionsAPI);
  podsRouter.post("/logs/:log/permissions/updates", logsApi.updatePermissions);
  podsRouter.get("/logs/:log/files/(.*)", logsApi.getFile);

  const koaPod = new Koa();
  koaPod.use(jwtMiddleware({ exclude: [/^\/channels$/] }));
  koaPod.use(
    bodyParser({
      multipart: true,
      formidable: { maxFieldsSize: appConfig.maxFileSize || 8 * MEGABYTE },
    })
  );
  koaPod.use(podsRouter.routes());
  koaPod.use(podsRouter.allowedMethods());
  const podCallback = koaPod.callback();

  function requestCallback(
    req: IncomingMessage | Http2ServerRequest,
    res: ServerResponse | Http2ServerResponse
  ) {
    const hostname = req.headers.host?.split(":")[0];
    if (hostname === appConfig.hostname) {
      podmasterCallback(req, res);
    } else {
      podCallback(req, res);
    }
  }

  const server = createHttpServer(requestCallback, appConfig);

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
