import createLog from "../../domain/log/createLog";
import * as config from "../../config";
import { MISSING_POD, NOT_FOUND, UNKNOWN_ERROR } from "../../errors/codes";
import { IRouterContext } from "koa-router";
import getLogs from "../../domain/log/getLogs";
import handleResult from "../handleResult";

export type GetLogsAPIResult = {
  logs: {
    log: string;
  }[];
};

export default async function getLogsAPI(ctx: IRouterContext) {
  const appConfig = config.get();
  const hostname = ctx.URL.hostname;

  await handleResult(ctx, async () => {
    const result = await getLogs(
      ctx.state.jwt.claims.iss,
      ctx.state.jwt.claims.sub,
      hostname,
      ctx.request.body.tags
    );
    const body: GetLogsAPIResult = {
      logs: result.logs,
    };
    ctx.body = body;
  });
}
