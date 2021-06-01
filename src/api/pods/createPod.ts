import { IRouterContext } from "koa-router";
import createPod from "../../domain/pod/createPod";
import * as config from "../../config";
import { NOT_FOUND, UNKNOWN_ERROR } from "../../errors/codes";

export type CreatePodAPIResult = {
  hostname: string;
  pod: string
};

export default async function createPodAPI(ctx: IRouterContext) {
  const appConfig = config.get();
  const hostname = ctx.URL.hostname;
  if (hostname === appConfig.hostname) {
    const result = await createPod(ctx.state.jwt.claims);
    if (result.success) {
      const apiResult: CreatePodAPIResult = {
        pod: result.pod,
        hostname: result.hostname,
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
