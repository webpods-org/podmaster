import { IRouterContext } from "koa-router";
import createPod from "../../domain/pod/createPod.js";
import * as config from "../../config/index.js";
import { NOT_FOUND, POD_EXISTS } from "../../errors/codes.js";
import handleResult from "../handleResult.js";

export type CreatePodAPIResult = {
  hostname: string;
};

export default async function createPodAPI(ctx: IRouterContext): Promise<void> {
  const appConfig = config.get();
  const hostname = ctx.URL.hostname;
  if (hostname === appConfig.hostname) {
    await handleResult(
      ctx,
      () =>
        createPod(
          ctx.request.body.id,
          ctx.request.body.name,
          ctx.request.body.description || "",
          ctx.state.jwt?.claims
        ),
      (result) => {
        const body: CreatePodAPIResult = {
          hostname: result.value.hostname,
        };
        ctx.body = body;
      },
      (errorResult) => {
        if (errorResult.code === POD_EXISTS) {
          ctx.status = 403;
          ctx.body = {
            error: errorResult.error,
            code: errorResult.code,
          };
          return { handled: true };
        } else {
          return { handled: false };
        }
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
