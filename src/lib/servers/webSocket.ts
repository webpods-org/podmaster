import { IncomingMessage, Server as HttpServer } from "http";
import { Server as HttpsServer } from "https";
import { Socket } from "net";
import WebSocket = require("ws");
import getJwtParams from "../jwt/getJwtParams";

export function attachWebSocketServer(httpServer: HttpServer | HttpsServer) {
  const wss = new WebSocket.Server({ noServer: true });
  const interval = setInterval(function ping() {
    wss.clients.forEach(function each(ws: any) {
      if (ws.isAlive === false || !ws.webpodsTracking) {
        return ws.terminate();
      } else {
        ws.isAlive = false;
        ws.ping(function noop() {});
      }
    });
  }, 30000);

  wss.on("close", function close() {
    clearInterval(interval);
  });

  httpServer.on("upgrade", makeUpgrade(wss));

  wss.on("connection", requestHandler);
  return wss;
}

function makeUpgrade(webSocketServer: WebSocket.Server) {
  return function upgrade(
    request: IncomingMessage,
    socket: Socket,
    head: Buffer
  ) {
    if (request.url) {
      if (webSocketServer) {
        webSocketServer.handleUpgrade(request, socket, head, function done(ws) {
          webSocketServer.emit("connection", ws, request);
        });
      } else {
        socket.destroy();
      }
    } else {
      socket.destroy();
    }
  };
}

function requestHandler(ws: WebSocket, request: IncomingMessage) {
  if (request.url) {
    const url = new URL(request.url);
    const route = url.pathname;
    if (route === "/channels") {
      // This is for finding dead connections.
      (ws as any).isAlive = true;
      ws.on("pong", function heartbeat() {
        (this as any).isAlive = true;
      });

      ws.on("message", onMessage(ws, request));
      ws.on("close", onClose(request));
    }
  }
}

type WebSocketAuthMessage = {
  token: string;
};

function onMessage(ws: WebSocket, request: IncomingMessage) {
  return async function messageHandler(message: string) {
    // If this is the first message, it needs to be a JWT
    if (!(ws as any).webpodsTracking) {
      const authMessage: WebSocketAuthMessage = JSON.parse(message);
      if (authMessage) {
        const jwtResult = await getJwtParams(authMessage.token);
        if (jwtResult.ok) {
          (ws as any).webpodsTracking = {
            jwtParams: jwtResult.value,
          };
        }
      }
    }
  };
}

function onClose(request: IncomingMessage) {
  return async function messageHandler(message: string) {};
}
