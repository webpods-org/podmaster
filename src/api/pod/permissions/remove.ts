import { handleResultWithJwt } from "../../handleResult.js";
import { IKoaPodAppContext } from "../../../types/koa.js";
import deletePermissions from "../../../domain/permissions/deletePermissions.js";
import getQuery from "../../utils/getParam.js";

export type RemovePermissionsAPIResult = {};

export default async function removeAPI(ctx: IKoaPodAppContext): Promise<void> {
  const hostname = ctx.URL.hostname;

  const iss = getQuery(ctx.query.iss);
  const sub = getQuery(ctx.query.sub);

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
