import { IncomingMessage } from "http";
import getJwtParams from "../../lib/jwt/getJwtParams";
import {
  TrackedWebSocket,
  WebSocketAuthMessage,
  WebSocketPublishMessage,
  WebSocketSubscribeMessage,
  WebSocketUnsubscribeMessage,
} from "../../types/webSocket";
import * as jsonwebtoken from "jsonwebtoken";
import { addSubscription, publish, removeSubscription } from "./subscriptions";
import validateClaims from "../../lib/jwt/validateClaims";
import { getPodByHostname } from "../pod/getPodByHostname";
import * as config from "../../config";
import * as db from "../../db";
import { join } from "path";
import { getPermissionsForLog } from "../log/checkPermissionsForLog";
import { ACCESS_DENIED } from "../../errors/codes";

export function handleMessage(
  hostname: string,
  ws: TrackedWebSocket,
  request: IncomingMessage
) {
  return async function messageHandler(message: string) {
    const appConfig = config.get();

    // If this is the first message, it needs to be a JWT
    if (!ws.webpodsTracking) {
      const authMessage: WebSocketAuthMessage = JSON.parse(message);
      try {
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
            ws.webpodsTracking = {
              status: "VALIDATED_JWT",
              jwtClaims,
              channels: [],
            };
          }
        } else {
          ws.terminate();
        }
      } catch (ex) {
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
          const [log, channelId] = channel.split("/");

          const pod = await getPodByHostname(hostname);
          if (pod) {
            const podDataDir = join(appConfig.storage.dataDir, pod.dataDir);
            const podDb = db.getPodDb(podDataDir);
            const permissions = await getPermissionsForLog(
              pod,
              ws.webpodsTracking.jwtClaims.iss,
              ws.webpodsTracking.jwtClaims.sub,
              log,
              podDb
            );

            if (permissions.subscribe) {
              ws.webpodsTracking.status;
              addSubscription(
                channel,
                ws.webpodsTracking.jwtClaims.iss,
                ws.webpodsTracking.jwtClaims.sub,
                ws
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
        }
      } else if (data.type === "message") {
        for (const channel of data.channels) {
          const [log, channelId] = channel.split("/");
          const pod = await getPodByHostname(hostname);
          if (pod) {
            const podDataDir = join(appConfig.storage.dataDir, pod.dataDir);
            const podDb = db.getPodDb(podDataDir);
            const permissions = await getPermissionsForLog(
              pod,
              ws.webpodsTracking.jwtClaims.iss,
              ws.webpodsTracking.jwtClaims.sub,
              log,
              podDb
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
