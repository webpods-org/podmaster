import { IncomingMessage } from "http";
import WebSocket = require("ws");

export function handleClose(
  hostname: string,
  ws: WebSocket,
  request: IncomingMessage
) {
  return async function messageHandler(message: string) {};
}
