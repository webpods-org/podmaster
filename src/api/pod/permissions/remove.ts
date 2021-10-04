import { handleResultWithJwt } from "../../handleResult.js";
import { IKoaPodAppContext } from "../../../types/koa.js";
import deletePermissions from "../../../domain/permissions/deletePermissions.js";
import getQueryParameter from "../../../lib/http/getQueryParam.js";

export type RemovePermissionsAPIResult = {};

export default async function removeAPI(ctx: IKoaPodAppContext): Promise<void> {
  const hostname = ctx.URL.hostname;

  const iss = getQueryParameter(ctx.query.iss);
  const sub = getQueryParameter(ctx.query.sub);

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
}
