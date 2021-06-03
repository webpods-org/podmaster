import * as config from "../../config";
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

  await handleResult(
    ctx,
    () =>
      getLogs(
        ctx.state.jwt.claims.iss,
        ctx.state.jwt.claims.sub,
        hostname,
        ctx.request.body.tags
      ),
    (result) => {
      const body: GetLogsAPIResult = {
        logs: result.logs,
      };
      ctx.body = body;
    }
  );
}
