import handleResult from "../../handleResult.js";
import { IKoaAppContext } from "../../../types/koa.js";
import { ACCESS_DENIED } from "../../../errors/codes.js";
import { ensureJwt } from "../../utils/ensureJwt.js";
import addPermissionToken from "../../../domain/permissionTokens/addPermissionTokens.js";

export type AddPermissionTokenAPIResult = {
  id: string;
};

export default async function addAPI(ctx: IKoaAppContext): Promise<void> {
  const hostname = ctx.URL.hostname;

  await handleResult(
    ctx,
    () =>
      ensureJwt(ctx.state.jwt)
        ? addPermissionToken(
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
            code: ACCESS_DENIED,
          }),
    (result) => {
      const body: AddPermissionTokenAPIResult = {
        id: result.value.id,
      };
      ctx.body = body;
    }
  );
}
