import { handleResultWithJwt } from "../../handleResult.js";
import { IKoaPodAppContext } from "../../../types/koa.js";
import getQuery from "../../utils/getParam.js";
import deletePermissionTokens from "../../../domain/permissionTokens/deletePermissionTokens.js";

export type DeletePermissionTokenAPIResult = {};

export default async function removeAPI(ctx: IKoaPodAppContext): Promise<void> {
  const hostname = ctx.URL.hostname;

  const iss = getQuery(ctx.query.iss);
  const sub = getQuery(ctx.query.sub);

  await handleResultWithJwt(
    ctx,
    (ctx) =>
      deletePermissionTokens(hostname, ctx.params.id, ctx.state.jwt.claims),
    () => {
      const body: DeletePermissionTokenAPIResult = {};
      ctx.body = body;
    }
  );
}
