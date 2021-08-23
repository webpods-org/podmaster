import { IncomingMessage } from "http";
import WebSocket from "ws";

export function handleClose(
  hostname: string,
  ws: WebSocket,
  request: IncomingMessage
) {
  return async function messageHandler(message: string) {};
}
