import { IRouterContext } from "koa-router";
import * as config from "../../config";
import { NOT_FOUND } from "../../errors/codes";
import { getPods } from "../../domain/pod/getPods";
import handleResult from "../handleResult";

export type GetPodsAPIResult = {
  pods: {
    hostname: string;
    hostnameAlias: string | null;
  }[];
};

export default async function getPodsAPI(ctx: IRouterContext) {
  const appConfig = config.get();
  const hostname = ctx.URL.hostname;

  if (hostname === appConfig.hostname) {
    await handleResult(
      ctx,
      () => getPods(ctx.state.jwt?.claims.iss, ctx.state.jwt?.claims.sub),
      (result) => {
        const body: GetPodsAPIResult = {
          pods: result.value.pods.map((x) => ({
            hostname: x.hostname,
            hostnameAlias: x.hostnameAlias,
          })),
        };
        ctx.body = body;
      }
    );
  } else {
    ctx.status = 404;
    ctx.body = {
      error: "Not found.",
      code: NOT_FOUND,
    };
  }
}
