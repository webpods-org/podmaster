import WebSocket from "ws";
import { PodJwtClaims } from "./index.js";

export type TrackedWebSocket = WebSocket & {
  isAlive?: boolean;
  webpodsTracking?: {
    status: "VALIDATED_JWT" | "WAITING_TO_CONNECT" | "CONNECTED";
    jwtClaims: PodJwtClaims;
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
