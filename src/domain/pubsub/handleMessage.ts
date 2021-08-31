import jsonwebtoken from "jsonwebtoken";
import { IncomingMessage } from "http";

import getJwtParams from "../../lib/jwt/getJwtParams.js";
import {
  TrackedWebSocket,
  WebSocketAuthMessage,
  WebSocketPublishMessage,
  WebSocketSubscribeMessage,
  WebSocketUnsubscribeMessage,
} from "../../types/webSocket.js";
import {
  addSubscription,
  publish,
  removeSubscription,
} from "./subscriptions.js";
import validateClaims from "../../lib/jwt/validateClaims.js";
import { getPodByHostname } from "../pod/getPodByHostname.js";
import * as db from "../../db/index.js";
import { getPermissionsForLog } from "../log/getPermissionsForLog.js";
import {
  ACCESS_DENIED,
  INVALID_JWT,
  MISSING_POD,
  UNKNOWN_ERROR,
} from "../../errors/codes.js";
import { getPodDataDir } from "../../storage/index.js";

export function handleMessage(
  hostname: string,
  ws: TrackedWebSocket,
  request: IncomingMessage
) {
  return async function messageHandler(message: string) {
    // If this is the first message, it needs to be a JWT
    if (!ws.webpodsTracking) {
      try {
        const authMessage: WebSocketAuthMessage = JSON.parse(message);
        const jwtResult = await getJwtParams(authMessage.token);
        if (jwtResult.ok) {
          const jwtClaims = jsonwebtoken.verify(
            jwtResult.value.token,
            jwtResult.value.publicKey,
            {
              algorithms: [jwtResult.value.alg],
            }
          );

          if (validateClaims(jwtClaims)) {
            ws.send(
              JSON.stringify({
                event: "connect",
              })
            );
            ws.webpodsTracking = {
              status: "VALIDATED_JWT",
              jwtClaims,
              channels: [],
            };
          }
        } else {
          ws.send(
            JSON.stringify({
              error: "Invalid JWT.",
              code: INVALID_JWT,
            })
          );
          ws.terminate();
        }
      } catch (ex) {
        ws.send(
          JSON.stringify({
            error: "Unknown Error.",
            code: UNKNOWN_ERROR,
          })
        );
        ws.terminate();
      }
    }
    // This is an active connection.
    else {
      const data:
        | WebSocketSubscribeMessage
        | WebSocketUnsubscribeMessage
        | WebSocketPublishMessage = JSON.parse(message);
      if (data.type === "subscribe") {
        ws.webpodsTracking.channels = ws.webpodsTracking.channels.concat(
          data.channels
        );
        for (const channel of data.channels) {
          const [log] = channel.split("/");

          const pod = await getPodByHostname(hostname);
          if (pod) {
            const podDataDir = getPodDataDir(pod.id);
            const podDb = db.getPodDb(podDataDir);
            const permissions = await getPermissionsForLog(
              hostname,
              log,
              podDb,
              ws.webpodsTracking.jwtClaims
            );

            if (permissions.subscribe) {
              addSubscription(
                channel,
                ws.webpodsTracking.jwtClaims.iss,
                ws.webpodsTracking.jwtClaims.sub,
                ws
              );
              ws.webpodsTracking.status = "CONNECTED";
              ws.webpodsTracking.channels.push(channel);
              ws.send(
                JSON.stringify({
                  event: "subscribe",
                  channel,
                })
              );
            } else {
              ws.send(
                JSON.stringify({
                  error: `Cannot access channel for log ${channel}.`,
                  code: ACCESS_DENIED,
                })
              );
            }
          } else {
            ws.send(
              JSON.stringify({
                error: `Pod ${hostname} not found.`,
                code: MISSING_POD,
              })
            );
            ws.terminate();
          }
        }
      } else if (data.type === "unsubscribe") {
        ws.webpodsTracking.channels = ws.webpodsTracking.channels.filter(
          (channel) => data.channels.every((x) => x !== channel)
        );
        for (const channel of data.channels) {
          removeSubscription(
            channel,
            ws.webpodsTracking.jwtClaims.iss,
            ws.webpodsTracking.jwtClaims.sub,
            ws
          );
          ws.webpodsTracking.channels = ws.webpodsTracking.channels.filter(
            (x) => x !== channel
          );
          ws.send(
            JSON.stringify({
              event: "unsubscribe",
              channel,
            })
          );
        }
      } else if (data.type === "message") {
        for (const channel of data.channels) {
          const [log] = channel.split("/");
          const pod = await getPodByHostname(hostname);
          if (pod) {
            const podDataDir = getPodDataDir(pod.id);
            const podDb = db.getPodDb(podDataDir);
            const permissions = await getPermissionsForLog(
              hostname,
              log,
              podDb,
              ws.webpodsTracking.jwtClaims
            );
            if (permissions.publish) {
              publish(
                channel,
                ws.webpodsTracking.jwtClaims.iss,
                ws.webpodsTracking.jwtClaims.sub,
                ws,
                data.message
              );
            }
          }
        }
      }
    }
  };
}
