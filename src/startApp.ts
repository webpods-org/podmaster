import { init as libJwtInit } from "./lib/jwt/getJwtValidationParams.js";
import * as db from "./db/index.js";
import { init as loggerInit } from "./lib/logger/log.js";
import * as config from "./config/index.js";
import { AppConfig } from "./types/types.js";
import { createHttpServer } from "./lib/servers/http.js";
import { attachWebSocketServer } from "./lib/servers/webSocket.js";
import { IncomingMessage, ServerResponse } from "http";
import { Http2ServerRequest, Http2ServerResponse } from "http2";
import podmasterServerSetup from "./api/podmaster/server.js";
import podServerSetup from "./api/pod/server.js";

const MEGABYTE = 1024 * 1024;

export default async function startApp(configFile: string) {
  const appConfig: AppConfig = (await import(configFile)).default;

  await init(appConfig);

  const podmasterCallback = podmasterServerSetup();
  const podCallback = podServerSetup();

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
