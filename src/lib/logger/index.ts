import winston from "winston";
import * as path from "path";

import * as config from "../../config/index.js";

let logger: winston.Logger;

export async function init(): Promise<void> {
  const appConfig = config.get();
  const errorsFile = path.join(appConfig.storage.dataDir, "logs/errors.log");
  const combinedLogsFile = path.join(
    appConfig.storage.dataDir,
    "logs/combined.log"
  );
  const transports =
    process.env.NODE_ENV === "development"
      ? [
          new winston.transports.Console({
            format: winston.format.simple(),
          }),
        ]
      : [
          new winston.transports.File({
            filename: errorsFile,
            level: "error",
          }),
          new winston.transports.File({
            filename: combinedLogsFile,
          }),
        ];
  logger = winston.createLogger({
    level: "info",
    format: winston.format.json(),
    defaultMeta: { service: "user-service" },
    transports,
  });
}

export type LogLevel =
  | "emerg"
  | "alert"
  | "crit"
  | "error"
  | "warning"
  | "notice"
  | "info"
  | "debug ";

export function log(level: LogLevel, message: string): void {
  logger.log(level, message);
}

export function logException(ex: any): void {
  logger.log("error", ex.message ? ex.message : ex.toString());
}
