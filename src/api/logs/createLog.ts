import createLog from "../../domain/log/createLog";
import * as config from "../../config";
import { IRouterContext } from "koa-router";
import handleResult from "../handleResult";
import getQuery from "../utils/getParam";
import transformQuery from "../utils/transformQuery";

export type CreateLogAPIResult = {
  log: string;
};

export default async function createLogAPI(ctx: IRouterContext) {
  const appConfig = config.get();
  const hostname = ctx.URL.hostname;

  await handleResult(
    ctx,
    () =>
      createLog(
        ctx.state.jwt.claims.iss,
        ctx.state.jwt.claims.sub,
        hostname,
        transformQuery(ctx.request.body.public, x => !!x),
        ctx.request.body.tags
      ),
    (result) => {
      const body: CreateLogAPIResult = {
        log: result.log,
      };
      ctx.body = body;
    }
  );
}
