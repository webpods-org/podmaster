import createLog from "../../domain/log/createLog";
import * as config from "../../config";
import { IRouterContext } from "koa-router";
import handleResult from "../handleResult";
import getQuery from "../utils/getParam";
import transformQuery from "../utils/transformQuery";
import { IKoaAppContext } from "../../types/koa";
import { ACCESS_DENIED } from "../../errors/codes";

export type CreateLogAPIResult = {
  log: string;
};

export default async function createLogAPI(ctx: IKoaAppContext) {
  const appConfig = config.get();
  const hostname = ctx.URL.hostname;

  await handleResult(
    ctx,
    () =>
      ctx.state.jwt?.claims.iss && ctx.state.jwt?.claims.sub
        ? createLog(
            ctx.state.jwt?.claims.iss,
            ctx.state.jwt?.claims.sub,
            hostname,
            transformQuery(ctx.request.body.public, (x) => !!x),
            ctx.request.body.tags
          )
        : Promise.resolve({
            ok: false,
            error: "Access Denied.",
            code: ACCESS_DENIED,
          }),
    (result) => {
      const body: CreateLogAPIResult = {
        log: result.log,
      };
      ctx.body = body;
    }
  );
}
