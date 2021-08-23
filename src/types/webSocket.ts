import WebSocket from "ws";
import { JwtClaims } from "./types.js";

export type TrackedWebSocket = WebSocket & {
  isAlive?: boolean;
  webpodsTracking?: {
    status: "VALIDATED_JWT" | "WAITING_TO_CONNECT" | "CONNECTED";
    jwtClaims: JwtClaims;
    channels: string[];
  };
};

export type WebSocketAuthMessage = {
  token: string;
};

export type WebSocketSubscribeMessage = {
  type: "subscribe";
  channels: string[];
};

export type WebSocketUnsubscribeMessage = {
  type: "unsubscribe";
  channels: string[];
};

export type WebSocketPublishMessage = {
  type: "message";
  channels: string[];
  message: string;
};
