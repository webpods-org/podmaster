import { IRouterContext } from "koa-router";
import * as config from "../../config";
import { NOT_FOUND, UNKNOWN_ERROR } from "../../errors/codes";
import { getPods } from "../../domain/pod/getPods";

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
    const result = await getPods(
      ctx.state.jwt.claims.iss,
      ctx.state.jwt.claims.sub
    );
    if (result.success) {
      const apiResult: GetPodsAPIResult = {
        pods: result.pods.map((x) => ({
          hostname: x.hostname,
          hostnameAlias: x.hostnameAlias,
        })),
      };
      ctx.body = apiResult;
    } else {
      // TODO - fill this by checking error code.
      ctx.status = 500;
      ctx.body = { error: "Internal server error.", code: UNKNOWN_ERROR };
    }
  } else {
    ctx.status = 404;
    ctx.body = {
      error: "Not found.",
      code: NOT_FOUND,
    };
  }
}
