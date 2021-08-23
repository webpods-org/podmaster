import winston from "winston";

let logger: winston.Logger;

export async function init() {
  const transports =
    process.env.NODE_ENV === "development"
      ? [
          new winston.transports.Console({
            format: winston.format.simple(),
          }),
        ]
      : [
          new winston.transports.File({
            filename: "error.log",
            level: "error",
          }),
          new winston.transports.File({ filename: "combined.log" }),
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

export function log(level: LogLevel, message: string) {
  logger.log(level, message);
}

export function logException(ex: any) {
  logger.log("error", ex.toString() + ex.message ? "::" + ex.message : "");
}
