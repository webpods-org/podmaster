import { IncomingMessage, Server as HttpServer } from "http";
import { Server as HttpsServer } from "https";
import { Socket } from "net";
import WebSocket from "ws";

import { AppConfig } from "../../types/types.js";
import { TrackedWebSocket } from "../../types/webSocket.js";
import { handleMessage } from "../../domain/pubsub/handleMessage.js";
import { handleClose } from "../../domain/pubsub/handleClose.js";
import { INACTIVE, SERVER_BUSY } from "../../errors/codes.js";

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
      ws.send(
        JSON.stringify({
          error: "Inactive for too long.",
          code: INACTIVE,
        })
      );
      ws.terminate();
    } else {
      ws.isAlive = false;
      ws.ping(function noop() {});
      // Client has not asked for any connection yet. Terminate.
      if (ws.webpodsTracking.status === "WAITING_TO_CONNECT") {
        ws.send(
          JSON.stringify({
            error: "Inactive for too long.",
            code: INACTIVE,
          })
        );
        ws.terminate();
      } else if (ws.webpodsTracking.status === "VALIDATED_JWT") {
        ws.webpodsTracking.status = "WAITING_TO_CONNECT";
      }
    }
  }

  function requestHandler(ws: WebSocket, request: IncomingMessage) {
    const trackedWS = ws as TrackedWebSocket;
    const hostname = request.headers.host
      ? request.headers.host.split(":")[0]
      : "localhost";
    if (
      appConfig.pubsub?.maxConnections &&
      wss.clients.size === appConfig.pubsub?.maxConnections
    ) {
      trackedWS.send(
        JSON.stringify({
          error: "Server is too busy.",
          code: SERVER_BUSY,
        })
      );
      trackedWS.terminate();
    } else {
      if (request.url) {
        if (request.url === "/channels") {
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
