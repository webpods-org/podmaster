import { IRouterContext } from "koa-router";
import createPod from "../../domain/pod/createPod";
import * as config from "../../config";
import { NOT_FOUND, UNKNOWN_ERROR } from "../../errors/codes";
import handleResult from "../handleResult";

export type CreatePodAPIResult = {
  hostname: string;
  pod: string;
};

export default async function createPodAPI(ctx: IRouterContext) {
  const appConfig = config.get();
  const hostname = ctx.URL.hostname;
  if (hostname === appConfig.hostname) {
    await handleResult(ctx, async () => {
      const result = await createPod(ctx.state.jwt.claims);
      const body: CreatePodAPIResult = {
        pod: result.pod,
        hostname: result.hostname,
      };
      ctx.body = body;
    });
  } else {
    ctx.status = 404;
    ctx.body = {
      error: "Not found.",
      code: NOT_FOUND,
    };
  }
}
