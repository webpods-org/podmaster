import addPermissions from "../../../domain/permissions/addPermissions.js";
import handleResult from "../../handleResult.js";
import { IKoaAppContext } from "../../../types/koa.js";
import errors from "../../../errors/codes.js";
import { ensureJwt } from "../../utils/ensureJwt.js";

export type AddPermissionsAPIResult = {};

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
            code: errors.ACCESS_DENIED,
          }),
    (result) => {
      const body: AddPermissionsAPIResult = {};
      ctx.body = body;
    }
  );
}
