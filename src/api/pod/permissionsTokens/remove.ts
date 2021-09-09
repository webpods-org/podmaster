import handleResult from "../../handleResult.js";
import { IKoaAppContext } from "../../../types/koa.js";
import { ACCESS_DENIED, MISSING_PARAMETERS } from "../../../errors/codes.js";
import { ensureJwt } from "../../utils/ensureJwt.js";
import getQuery from "../../utils/getParam.js";
import deletePermissionTokens from "../../../domain/permissionTokens/deletePermissionTokens.js";

export type DeletePermissionTokenAPIResult = {};

export default async function removeAPI(ctx: IKoaAppContext): Promise<void> {
  const hostname = ctx.URL.hostname;

  const iss = getQuery(ctx.query.iss);
  const sub = getQuery(ctx.query.sub);

  await handleResult(
    ctx,
    () =>
      ensureJwt(ctx.state.jwt)
        ? deletePermissionTokens(hostname, ctx.params.id, ctx.state.jwt.claims)
        : Promise.resolve({
            ok: false,
            error: "Access Denied.",
            code: ACCESS_DENIED,
          }),
    (result) => {
      const body: DeletePermissionTokenAPIResult = {};
      ctx.body = body;
    }
  );
}
