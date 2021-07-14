import { IncomingMessage, Server as HttpServer } from "http";
import { Server as HttpsServer } from "https";
import { Socket } from "net";
import { AppConfig } from "../../types/types";
import WebSocket = require("ws");
import { TrackedWebSocket } from "../../types/webSocket";
import { handleMessage } from "../../domain/pubsub/handleMessage";
import { handleClose } from "../../domain/pubsub/handleClose";

// Check WS client connection status every 30s.
const TRACKING_INTERVAL_MS = 30000;

export function attachWebSocketServer(
  httpServer: HttpServer | HttpsServer,
  appConfig: AppConfig
) {
  const wss = new WebSocket.Server({ noServer: true });
  const interval = setInterval(function ping() {
    wss.clients.forEach(checkConnectionValidity);
  }, TRACKING_INTERVAL_MS);

  wss.on("close", function close() {
    clearInterval(interval);
  });

  httpServer.on("upgrade", upgrade);

  wss.on("connection", requestHandler);
  return wss;

  function checkConnectionValidity(ws: TrackedWebSocket) {
    if (ws.isAlive === false || !ws.webpodsTracking) {
      ws.terminate();
    } else {
      ws.isAlive = false;
      ws.ping(function noop() {});
      // Client has not asked for any connection yet. Terminate.
      if (ws.webpodsTracking.status === "WAITING_TO_CONNECT") {
        ws.terminate();
      } else if (ws.webpodsTracking.status === "VALIDATED_JWT") {
        ws.webpodsTracking.status = "WAITING_TO_CONNECT";
      }
    }
  }

  function requestHandler(ws: WebSocket, request: IncomingMessage) {
    const trackedWS = ws as TrackedWebSocket;
    const hostname = new URL(request.url as string).hostname;

    if (
      appConfig.pubsub?.maxConnections &&
      wss.clients.size === appConfig.pubsub?.maxConnections
    ) {
      trackedWS.terminate();
    } else {
      if (request.url) {
        const url = new URL(request.url);
        const route = url.pathname;
        if (route === "/channels") {
          // This is for finding dead connections.
          trackedWS.isAlive = true;
          trackedWS.on("pong", function heartbeat() {
            (this as any).isAlive = true;
          });

          trackedWS.on("message", handleMessage(hostname, trackedWS, request));
          trackedWS.on("close", handleClose(hostname, trackedWS, request));
        }
      }
    }
  }

  function upgrade(request: IncomingMessage, socket: Socket, head: Buffer) {
    if (request.url) {
      if (wss) {
        wss.handleUpgrade(request, socket, head, function done(ws) {
          wss.emit("connection", ws, request);
        });
      } else {
        socket.destroy();
      }
    } else {
      socket.destroy();
    }
  }
}
