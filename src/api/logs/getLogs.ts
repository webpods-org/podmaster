import createLog from "../../domain/log/createLog";
import * as config from "../../config";
import { MISSING_POD, NOT_FOUND, UNKNOWN_ERROR } from "../../errors/codes";
import { IRouterContext } from "koa-router";
import getLogs from "../../domain/log/getLogs";

export type GetLogsAPIResult = {
  logs: {
    log: string;
  }[];
};

export default async function getLogsAPI(ctx: IRouterContext) {
  const appConfig = config.get();
  const hostname = ctx.URL.hostname;

  const result = await getLogs(
    ctx.state.jwt.claims.iss,
    ctx.state.jwt.claims.sub,
    hostname,
    ctx.request.body.tags
  );
  if (result.success) {
    ctx.body = result;
  } else {
    if (result.code === MISSING_POD) {
      ctx.status = 500;
      ctx.body = result;
    } else {
      ctx.status = 500;
      ctx.body = { error: "Internal server error.", code: UNKNOWN_ERROR };
    }
  }
}
