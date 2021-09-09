import handleResult from "../../handleResult.js";
import getPermissions from "../../../domain/permissions/getPermissions.js";
import { IdentityPermission, PodPermission } from "../../../types/types.js";
import { IKoaAppContext } from "../../../types/koa.js";
import { ACCESS_DENIED, NOT_FOUND } from "../../../errors/codes.js";
import { ensureJwt } from "../../utils/ensureJwt.js";
import * as config from "../../../config/index.js";

export type GetPermissionsTokensAPIResult = {
  permissions: IdentityPermission[];
};

export default async function getAPI(
  ctx: IKoaAppContext
): Promise<void> {
  const hostname = ctx.URL.hostname;

  await handleResult(
    ctx,
    () =>
      ensureJwt(ctx.state.jwt)
        ? getPermissions(hostname, ctx.state.jwt.claims)
        : Promise.resolve({
            ok: false,
            error: "Access Denied.",
            code: ACCESS_DENIED,
          }),
    (result) => {
      const body: GetPermissionsTokensAPIResult = {
        permissions: result.value.permissions,
      };
      ctx.body = body;
    }
  );
}
