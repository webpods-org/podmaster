import handleResult from "../../../handleResult.js";
import { IKoaAppContext } from "../../../../types/koa.js";
import { ACCESS_DENIED, NOT_FOUND } from "../../../../errors/codes.js";
import { ensureJwt } from "../../../utils/ensureJwt.js";
import createAuthToken from "../../../../domain/auth/tokens/createToken.js";
import * as config from "../../../../config/index.js";

export type CreateAuthTokenAPIResult = { jwt: string };

export default async function createAPI(ctx: IKoaAppContext): Promise<void> {
  const appConfig = config.get();
  const hostname = ctx.URL.hostname;
  if (hostname === appConfig.hostname) {
    await handleResult(
      ctx,
      () =>
        ensureJwt(ctx.state.jwt)
          ? createAuthToken(ctx.request.body.aud, ctx.state.jwt.claims)
          : Promise.resolve({
              ok: false,
              error: "Access Denied.",
              code: ACCESS_DENIED,
            }),
      (result) => {
        const body: CreateAuthTokenAPIResult = { jwt: result.value.jwt };
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
