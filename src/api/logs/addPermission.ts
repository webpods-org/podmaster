import * as config from "../../config";
import { IRouterContext } from "koa-router";
import addPermission from "../../domain/log/addPermission";
import handleResult from "../handleResult";

export type AddPermissionAPIResult = {
  added: boolean;
};

export default async function addPermissionAPI(ctx: IRouterContext) {
  const appConfig = config.get();
  const hostname = ctx.URL.hostname;

  await handleResult(ctx, async () => {
    const result = await addPermission(
      ctx.state.jwt.claims.iss,
      ctx.state.jwt.claims.sub,
      hostname,
      ctx.params.log,
      ctx.request.body
    );

    const body: AddPermissionAPIResult = {
      added: result.added,
    };
    ctx.body = body;
  });
}
