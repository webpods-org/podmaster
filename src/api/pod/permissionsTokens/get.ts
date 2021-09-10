import handleResult from "../../handleResult.js";
import {
  PermissionToken,
} from "../../../types/types.js";
import { IKoaAppContext } from "../../../types/koa.js";
import { ACCESS_DENIED } from "../../../errors/codes.js";
import { ensureJwt } from "../../utils/ensureJwt.js";
import getPermissionTokens from "../../../domain/permissionTokens/getPermissionTokens.js";

export type GetPermissionTokensAPIResult = {
  permissionTokens: PermissionToken[];
};

export default async function getAPI(ctx: IKoaAppContext): Promise<void> {
  const hostname = ctx.URL.hostname;

  await handleResult(
    ctx,
    () =>
      ensureJwt(ctx.state.jwt)
        ? getPermissionTokens(hostname, ctx.state.jwt.claims)
        : Promise.resolve({
            ok: false,
            error: "Access Denied.",
            code: ACCESS_DENIED,
          }),
    (result) => {
      const body: GetPermissionTokensAPIResult = {
        permissionTokens: result.value.permissionTokens,
      };
      ctx.body = body;
    }
  );
}