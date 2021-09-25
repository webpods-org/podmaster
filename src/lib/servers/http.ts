import { IncomingMessage, ServerResponse } from "http";
import { createServer as httpCreateServer } from "http";
import { createServer as httpsCreateServer } from "https";
import { AppConfig } from "../../types/index.js";

type RequestHandler = (req: IncomingMessage, res: ServerResponse) => void;

export function createHttpServer(
  requestHandler: RequestHandler,
  config: AppConfig
) {
  return config.useHttps
    ? httpsCreateServer(
        {
          key: config.useHttps.key,
          cert: config.useHttps.cert,
          ca: config.useHttps.ca,
        },
        requestHandler
      )
    : httpCreateServer(requestHandler);
}
