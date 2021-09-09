import addPermissions from "../../../domain/permissions/addPermissions.js";
import handleResult from "../../handleResult.js";
import { IKoaAppContext } from "../../../types/koa.js";
import { ACCESS_DENIED } from "../../../errors/codes.js";
import { ensureJwt } from "../../utils/ensureJwt.js";

export type UpdatePermissionsAPIResult = {};

export default async function addAPI(
  ctx: IKoaAppContext
): Promise<void> {
  const hostname = ctx.URL.hostname;

  await handleResult(
    ctx,
    () =>
      ensureJwt(ctx.state.jwt)
        ? addPermissions(hostname, ctx.request.body, ctx.state.jwt?.claims)
        : Promise.resolve({
            ok: false,
            error: "Access Denied.",
            code: ACCESS_DENIED,
          }),
    (result) => {
      const body: UpdatePermissionsAPIResult = {};
      ctx.body = body;
    }
  );
}
