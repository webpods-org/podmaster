import * as config from "../../../config/index.js";
import { ACCESS_DENIED, NOT_FOUND } from "../../../errors/codes.js";
import { getPods } from "../../../domain/pods/getPods.js";
import handleResult from "../../handleResult.js";
import { IKoaAppContext } from "../../../types/koa.js";
import { ensureJwt } from "../../utils/ensureJwt.js";

export type GetPodsAPIResult = {
  pods: {
    hostname: string;
    name: string;
    description: string;
  }[];
};

export default async function getAPI(ctx: IKoaAppContext): Promise<void> {
  const appConfig = config.get();
  const hostname = ctx.URL.hostname;

  if (hostname === appConfig.hostname) {
    await handleResult(
      ctx,
      () =>
        ensureJwt(ctx.state.jwt)
          ? getPods(ctx.state.jwt.claims)
          : Promise.resolve({
              ok: false,
              error: "Access Denied.",
              code: ACCESS_DENIED,
            }),
      (result) => {
        const body: GetPodsAPIResult = {
          pods: result.value.pods.map((x) => ({
            hostname: x.hostname,
            name: x.name,
            description: x.description,
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
