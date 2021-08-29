import handleResult from "../handleResult.js";
import getPermissions from "../../domain/log/getPermissions.js";
import { LogPermission } from "../../types/types.js";
import { IKoaAppContext } from "../../types/koa.js";
import { ACCESS_DENIED } from "../../errors/codes.js";

export type GetPermissionsAPIResult = {
  permissions: LogPermission[];
};

export default async function getPermissionsAPI(
  ctx: IKoaAppContext
): Promise<void> {
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
        permissions: result.value.permissions,
      };
      ctx.body = body;
    }
  );
}
