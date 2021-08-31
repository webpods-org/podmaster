import updatePermissions from "../../domain/pod/updatePermissions.js";
import handleResult from "../handleResult.js";
import { IKoaAppContext } from "../../types/koa.js";
import { ACCESS_DENIED } from "../../errors/codes.js";

export type UpdatePermissionsAPIResult = {
  added: number;
  removed: number;
};

export default async function updatePermissionsAPI(
  ctx: IKoaAppContext
): Promise<void> {
  const hostname = ctx.URL.hostname;

  await handleResult(
    ctx,
    () =>
      ctx.state.jwt?.claims.iss && ctx.state.jwt?.claims.sub
        ? updatePermissions(hostname, ctx.request.body, ctx.state.jwt?.claims)
        : Promise.resolve({
            ok: false,
            error: "Access Denied.",
            code: ACCESS_DENIED,
          }),
    (result) => {
      const body: UpdatePermissionsAPIResult = {
        added: result.value.added,
        removed: result.value.removed,
      };
      ctx.body = body;
    }
  );
}
