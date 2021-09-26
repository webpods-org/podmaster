import createPod from "../../../domain/pods/createPod.js";
import * as config from "../../../config/index.js";
import { ACCESS_DENIED, NOT_FOUND, POD_EXISTS } from "../../../errors/codes.js";
import handleResult from "../../handleResult.js";
import { ensureJwt as ensureJwt } from "../../utils/ensureJwt.js";
import { IKoaAppContext } from "../../../types/koa.js";

export type CreatePodAPIResult = {
  hostname: string;
};

export default async function createAPI(ctx: IKoaAppContext): Promise<void> {
  await handleResult(
    ctx,
    () =>
      ensureJwt(ctx.state.jwt)
        ? createPod(
            ctx.request.body.id,
            ctx.request.body.name,
            ctx.request.body.app,
            ctx.request.body.description || "",
            ctx.state.jwt.claims
          )
        : Promise.resolve({
            ok: false,
            error: "Access Denied.",
            code: ACCESS_DENIED,
          }),
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
}
