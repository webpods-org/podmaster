import * as config from "../../config";
import { IRouterContext } from "koa-router";
import updatePermissions from "../../domain/log/updatePermissions";
import handleResult from "../handleResult";
import { IKoaAppContext } from "../../types/koa";

export type UpdatePermissionsAPIResult = {
  added: number;
  removed: number;
};

export default async function updatePermissionsAPI(ctx: IKoaAppContext) {
  const hostname = ctx.URL.hostname;

  await handleResult(
    ctx,
    () =>
      updatePermissions(
        ctx.state.jwt?.claims.iss,
        ctx.state.jwt?.claims.sub,
        hostname,
        ctx.params.log,
        ctx.request.body
      ),
    (result) => {
      const body: UpdatePermissionsAPIResult = {
        added: result.added,
        removed: result.removed,
      };
      ctx.body = body;
    }
  );
}
