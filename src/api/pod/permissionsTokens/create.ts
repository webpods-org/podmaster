import { handleResult, handleResultWithJwt } from "../../handleResult.js";
import { IKoaPodAppContext } from "../../../types/koa.js";
import createPermissionTokens from "../../../domain/permissionTokens/createPermissionTokens.js";

export type CreatePermissionTokenAPIResult = {
  id: string;
};

export default async function createAPI(ctx: IKoaPodAppContext): Promise<void> {
  const hostname = ctx.URL.hostname;

  await handleResultWithJwt(
    ctx,
    (ctx) =>
      createPermissionTokens(
        hostname,
        ctx.request.body.permissions,
        ctx.request.body.maxRedemptions
          ? parseInt(ctx.request.body.maxRedemptions)
          : 1,
        ctx.request.body.expiry
          ? parseInt(ctx.request.body.expiry)
          : Date.now() + 24 * 3600 * 1000,
        ctx.state.jwt.claims
      ),
    (result) => {
      const body: CreatePermissionTokenAPIResult = {
        id: result.value.id,
      };
      ctx.body = body;
    }
  );
}
