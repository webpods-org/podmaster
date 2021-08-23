import { IRouterContext } from "koa-router";
import createPod from "../../domain/pod/createPod.js";
import * as config from "../../config/index.js";
import { NOT_FOUND } from "../../errors/codes.js";
import handleResult from "../handleResult.js";

export type CreatePodAPIResult = {
  hostname: string;
  pod: string;
};

export default async function createPodAPI(ctx: IRouterContext) {
  const appConfig = config.get();
  const hostname = ctx.URL.hostname;
  if (hostname === appConfig.hostname) {
    await handleResult(
      ctx,
      () => createPod(ctx.state.jwt?.claims),
      (result) => {
        const body: CreatePodAPIResult = {
          pod: result.value.pod,
          hostname: result.value.hostname,
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
