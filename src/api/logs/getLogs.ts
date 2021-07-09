import * as config from "../../config";
import { IRouterContext } from "koa-router";
import getLogs from "../../domain/log/getLogs";
import handleResult from "../handleResult";
import { IKoaAppContext } from "../../types/koa";
import { ACCESS_DENIED } from "../../errors/codes";

export type GetLogsAPIResult = {
  logs: {
    log: string;
  }[];
};

export default async function getLogsAPI(ctx: IKoaAppContext) {
  const appConfig = config.get();
  const hostname = ctx.URL.hostname;

  await handleResult(
    ctx,
    () =>
      ctx.state.jwt?.claims.iss && ctx.state.jwt?.claims.sub
        ? getLogs(
            ctx.state.jwt?.claims.iss,
            ctx.state.jwt?.claims.sub,
            hostname,
            ctx.request.body.tags
          )
        : Promise.resolve({
            ok: false,
            error: "Access Denied.",
            code: ACCESS_DENIED,
          }),
    (result) => {
      const body: GetLogsAPIResult = {
        logs: result.value.logs,
      };
      ctx.body = body;
    }
  );
}
