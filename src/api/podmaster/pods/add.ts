import createPod from "../../../domain/pod/createPod.js";
import * as config from "../../../config/index.js";
import { ACCESS_DENIED, NOT_FOUND, POD_EXISTS } from "../../../errors/codes.js";
import handleResult from "../../handleResult.js";
import { ensureJwt as ensureJwt } from "../../utils/ensureJwt.js";
import { IKoaAppContext } from "../../../types/koa.js";

export type AddPodAPIResult = {
  hostname: string;
};

export default async function addAPI(ctx: IKoaAppContext): Promise<void> {
  const appConfig = config.get();
  const hostname = ctx.URL.hostname;
  if (hostname === appConfig.hostname) {
    await handleResult(
      ctx,
      () =>
        ensureJwt(ctx.state.jwt)
          ? createPod(
              ctx.request.body.id,
              ctx.request.body.name,
              ctx.request.body.description || "",
              ctx.request.body.admin,
              ctx.state.jwt.claims
            )
          : Promise.resolve({
              ok: false,
              error: "Access Denied.",
              code: ACCESS_DENIED,
            }),
      (result) => {
        const body: AddPodAPIResult = {
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
