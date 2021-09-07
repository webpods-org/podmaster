import handleResult from "../../handleResult.js";
import { IKoaAppContext } from "../../../types/koa.js";
import {
  ACCESS_DENIED,
  MISSING_FIELD,
  MISSING_PARAMETERS,
} from "../../../errors/codes.js";
import { ensureJwt } from "../../utils/ensureJwt.js";
import deletePermissions from "../../../domain/permissions/deletePermissions.js";
import getQuery from "../../utils/getParam.js";

export type DeletePermissionsAPIResult = {};

export default async function deletePermissionsAPI(
  ctx: IKoaAppContext
): Promise<void> {
  const hostname = ctx.URL.hostname;

  const iss = getQuery(ctx.query.iss);
  const sub = getQuery(ctx.query.sub);

  if (iss && sub) {
    const identity = {
      iss,
      sub,
    };

    await handleResult(
      ctx,
      () =>
        ensureJwt(ctx.state.jwt)
          ? deletePermissions(hostname, identity, ctx.state.jwt.claims)
          : Promise.resolve({
              ok: false,
              error: "Access Denied.",
              code: ACCESS_DENIED,
            }),
      (result) => {
        const body: DeletePermissionsAPIResult = {};
        ctx.body = body;
      }
    );
  } else {
    ctx.status = 400;
    ctx.body = {
      ok: false,
      error: "The iss and sub parameters are mandatory.",
      code: MISSING_PARAMETERS,
    };
  }
}
