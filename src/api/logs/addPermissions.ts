import * as config from "../../config";
import { MISSING_POD, UNKNOWN_ERROR } from "../../errors/codes";
import { IRouterContext } from "koa-router";
import addPermissions from "../../domain/log/addPermissions";

export type AddPermissionsAPIResult = {};

export default async function addPermissionsAPI(ctx: IRouterContext) {
  const appConfig = config.get();
  const hostname = ctx.URL.hostname;

  const result = await addPermissions(
    ctx.state.jwt.claims.iss,
    ctx.state.jwt.claims.sub,
    hostname,
    ctx.params.log,
    ctx.request.body.permissions
  );
  if (result.success) {
    ctx.body = result;
  } else {
    if (result.code === MISSING_POD) {
      ctx.status = 500;
      ctx.body = result;
    } else {
      ctx.status = 500;
      ctx.body = { error: "Internal server error.", code: UNKNOWN_ERROR };
    }
  }
}
