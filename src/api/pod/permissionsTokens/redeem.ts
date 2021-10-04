import { handleResultWithJwt } from "../../handleResult.js";
import { IKoaPodAppContext } from "../../../types/koa.js";
import getQueryParameter from "../../../lib/http/getQueryParam.js";
import redeemPermissionToken from "../../../domain/permissionTokens/redeemPermissionToken.js";

export type RedeemPermissionTokenAPIResult = {};

export default async function redeemAPI(ctx: IKoaPodAppContext): Promise<void> {
  const hostname = ctx.URL.hostname;

  const iss = getQueryParameter(ctx.query.iss);
  const sub = getQueryParameter(ctx.query.sub);

  await handleResultWithJwt(
    ctx,
    (ctx) =>
      redeemPermissionToken(hostname, ctx.params.id, ctx.state.jwt.claims),
    () => {
      const body: RedeemPermissionTokenAPIResult = {};
      ctx.body = body;
    }
  );
}
