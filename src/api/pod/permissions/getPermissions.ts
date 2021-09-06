import handleResult from "../../handleResult.js";
import getPermissions from "../../../domain/pod/getPermissions.js";
import { PodPermission } from "../../../types/types.js";
import { IKoaAppContext } from "../../../types/koa.js";
import { ACCESS_DENIED, NOT_FOUND } from "../../../errors/codes.js";
import { ensureJwt } from "../../utils/ensureJwt.js";
import * as config from "../../../config/index.js";

export type GetPermissionsAPIResult = {
  permissions: PodPermission[];
};

export default async function getPermissionsAPI(
  ctx: IKoaAppContext
): Promise<void> {
  const appConfig = config.get();
  const hostname = ctx.URL.hostname;

  if (hostname === appConfig.hostname) {
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
  } else {
    ctx.status = 404;
    ctx.body = {
      error: "Not found.",
      code: NOT_FOUND,
    };
  }
}
