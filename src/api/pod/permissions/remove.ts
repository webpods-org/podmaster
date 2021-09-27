import { handleResultWithJwt } from "../../handleResult.js";
import { IKoaAppContext } from "../../../types/koa.js";
import errors from "../../../errors/codes.js";
import deletePermissions from "../../../domain/permissions/deletePermissions.js";
import getQuery from "../../utils/getParam.js";

export type RemovePermissionsAPIResult = {};

export default async function removeAPI(ctx: IKoaAppContext): Promise<void> {
  const hostname = ctx.URL.hostname;

  const iss = getQuery(ctx.query.iss);
  const sub = getQuery(ctx.query.sub);

  if (iss && sub) {
    const identity = {
      iss,
      sub,
    };

    await handleResultWithJwt(
      ctx,
      (ctx) => deletePermissions(hostname, identity, ctx.state.jwt.claims),
      () => {
        const body: RemovePermissionsAPIResult = {};
        ctx.body = body;
      }
    );
  } else {
    ctx.status = 400;
    ctx.body = {
      ok: false,
      error: "The iss and sub query parameters are mandatory.",
      code: errors.Validations.MISSING_FIELDS,
    };
  }
}
