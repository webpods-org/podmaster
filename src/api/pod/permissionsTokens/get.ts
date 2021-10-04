import { handleResultWithJwt } from "../../handleResult.js";
import { PermissionToken } from "../../../types/index.js";
import { IKoaPodAppContext } from "../../../types/koa.js";
import getPermissionTokens from "../../../domain/permissionTokens/getPermissionTokens.js";

export type GetPermissionTokensAPIResult = {
  permissionTokens: PermissionToken[];
};

export default async function getAPI(ctx: IKoaPodAppContext): Promise<void> {
  const hostname = ctx.URL.hostname;

  await handleResultWithJwt(
    ctx,
    (ctx) => getPermissionTokens(hostname, ctx.state.jwt.claims),
    (result) => {
      const body: GetPermissionTokensAPIResult = {
        permissionTokens: result.value.permissionTokens,
      };
      ctx.body = body;
    }
  );
}
