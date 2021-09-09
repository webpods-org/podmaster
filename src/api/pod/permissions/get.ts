import handleResult from "../../handleResult.js";
import getPermissions from "../../../domain/permissions/getPermissions.js";
import { IdentityPermission } from "../../../types/types.js";
import { IKoaAppContext } from "../../../types/koa.js";
import { ACCESS_DENIED } from "../../../errors/codes.js";
import { ensureJwt } from "../../utils/ensureJwt.js";

export type GetPermissionsAPIResult = {
  permissions: IdentityPermission[];
};

export default async function getAPI(ctx: IKoaAppContext): Promise<void> {
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
      const body: GetPermissionsAPIResult = {
        permissions: result.value.permissions,
      };
      ctx.body = body;
    }
  );
}
