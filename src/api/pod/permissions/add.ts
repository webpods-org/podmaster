import addPermissions from "../../../domain/permissions/addPermissions.js";
import { handleResultWithJwt } from "../../handleResult.js";
import { IKoaAppContext } from "../../../types/koa.js";

export type AddPermissionsAPIResult = {};

export default async function addAPI(ctx: IKoaAppContext): Promise<void> {
  const hostname = ctx.URL.hostname;

  await handleResultWithJwt(
    ctx,
    (ctx) => addPermissions(hostname, ctx.request.body, ctx.state.jwt?.claims),
    () => {
      const body: AddPermissionsAPIResult = {};
      ctx.body = body;
    }
  );
}
