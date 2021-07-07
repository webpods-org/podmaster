import { IRouterContext } from "koa-router";
import handleResult from "../handleResult";
import getPermissions from "../../domain/log/getPermissions";
import { Permission } from "../../types/types";
import { IKoaAppContext } from "../../types/koa";
import { ACCESS_DENIED } from "../../errors/codes";

export type GetPermissionsAPIResult = {
  permissions: Permission[];
};

export default async function addPermissionAPI(ctx: IKoaAppContext) {
  const hostname = ctx.URL.hostname;

  await handleResult(
    ctx,
    () =>
      ctx.state.jwt?.claims.iss && ctx.state.jwt?.claims.sub
        ? getPermissions(
            ctx.state.jwt?.claims.iss,
            ctx.state.jwt?.claims.sub,
            hostname,
            ctx.params.log
          )
        : Promise.resolve({
            ok: false,
            error: "Access Denied.",
            code: ACCESS_DENIED,
          }),
    (result) => {
      const body: GetPermissionsAPIResult = {
        permissions: result.permissions,
      };
      ctx.body = body;
    }
  );
}
