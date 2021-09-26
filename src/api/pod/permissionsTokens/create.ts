import handleResult from "../../handleResult.js";
import { IKoaAppContext } from "../../../types/koa.js";
import errors from "../../../errors/codes.js";
import { ensureJwt } from "../../utils/ensureJwt.js";
import createPermissionTokens from "../../../domain/permissionTokens/createPermissionTokens.js";

export type CreatePermissionTokenAPIResult = {
  id: string;
};

export default async function createAPI(ctx: IKoaAppContext): Promise<void> {
  const hostname = ctx.URL.hostname;

  await handleResult(
    ctx,
    () =>
      ensureJwt(ctx.state.jwt)
        ? createPermissionTokens(
            hostname,
            ctx.request.body.permissions,
            ctx.request.body.maxRedemptions
              ? parseInt(ctx.request.body.maxRedemptions)
              : 1,
            ctx.request.body.expiry
              ? parseInt(ctx.request.body.expiry)
              : Date.now() + 24 * 3600 * 1000,
            ctx.state.jwt.claims
          )
        : Promise.resolve({
            ok: false,
            error: "Access Denied.",
            code: errors.ACCESS_DENIED,
          }),
    (result) => {
      const body: CreatePermissionTokenAPIResult = {
        id: result.value.id,
      };
      ctx.body = body;
    }
  );
}
