import WebSocket = require("ws");
const subscriptions = new Map<string, Map<string, WebSocket[]>>();

export function getSubscriptions() {
  return subscriptions;
}

export function addSubscription(
  channel: string,
  iss: string,
  sub: string,
  ws: WebSocket
) {
  const channelSubscriptions = subscriptions.get(channel);
  if (!channelSubscriptions) {
    const newChannelSubscriptions = new Map<string, WebSocket[]>();
    const webSockets = [ws];
    newChannelSubscriptions.set(`${iss}:${sub}`, webSockets);
    subscriptions.set(channel, newChannelSubscriptions);
  } else {
    const webSockets = channelSubscriptions.get(`${iss}:${sub}`);
    if (!webSockets) {
      const newWebSockets = [ws];
      channelSubscriptions.set(`${iss}:${sub}`, newWebSockets);
    } else {
      webSockets.push(ws);
    }
  }
  ws.addEventListener("close", () => removeSubscription(channel, iss, sub, ws));
}

export function removeSubscription(
  channel: string,
  iss: string,
  sub: string,
  ws: WebSocket
) {
  const channelSubscriptions = subscriptions.get(channel);
  if (channelSubscriptions) {
    const webSockets = channelSubscriptions.get(`${iss}:${sub}`);
    if (webSockets) {
      const newWebSockets = webSockets.filter((x) => x !== ws);
      if (newWebSockets.length === 0) {
        channelSubscriptions.delete(`${iss}:${sub}`);
        if (channelSubscriptions.size === 0) {
          subscriptions.delete(channel);
        }
      } else {
        channelSubscriptions.set(`${iss}:${sub}`, newWebSockets);
      }
    }
  }
}

export function publish(
  channel: string,
  iss: string,
  sub: string,
  ws: WebSocket,
  message: string
) {
  const payload = JSON.stringify({
    event: "message",
    data: {
      iss,
      sub,
      message,
    },
  });
  const channelSubscriptions = subscriptions.get(channel);
  if (channelSubscriptions) {
    for (const [, webSockets] of channelSubscriptions.entries()) {
      for (const subscribedSocket of webSockets) {
        if (subscribedSocket !== ws) {
          subscribedSocket.send(payload);
        }
      }
    }
  }
}
