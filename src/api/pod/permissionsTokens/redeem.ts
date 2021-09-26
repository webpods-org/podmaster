import handleResult from "../../handleResult.js";
import { IKoaAppContext } from "../../../types/koa.js";
import errors from "../../../errors/codes.js";
import { ensureJwt } from "../../utils/ensureJwt.js";
import getQuery from "../../utils/getParam.js";
import redeemPermissionToken from "../../../domain/permissionTokens/redeemPermissionToken.js";

export type RedeemPermissionTokenAPIResult = {};

export default async function redeemAPI(ctx: IKoaAppContext): Promise<void> {
  const hostname = ctx.URL.hostname;

  const iss = getQuery(ctx.query.iss);
  const sub = getQuery(ctx.query.sub);

  await handleResult(
    ctx,
    () =>
      ensureJwt(ctx.state.jwt)
        ? redeemPermissionToken(hostname, ctx.params.id, ctx.state.jwt.claims)
        : Promise.resolve({
            ok: false,
            error: "Access Denied.",
            code: errors.ACCESS_DENIED,
          }),
    () => {
      const body: RedeemPermissionTokenAPIResult = {};
      ctx.body = body;
    }
  );
}
