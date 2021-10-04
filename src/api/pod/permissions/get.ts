import { handleResultWithJwt } from "../../handleResult.js";
import getPermissions from "../../../domain/permissions/getPermissions.js";
import { IdentityPermission } from "../../../types/index.js";
import { IKoaPodAppContext } from "../../../types/koa.js";

export type GetPermissionsAPIResult = {
  permissions: IdentityPermission[];
};

export default async function getAPI(ctx: IKoaPodAppContext): Promise<void> {
  const hostname = ctx.URL.hostname;

  await handleResultWithJwt(
    ctx,
    (ctx) => getPermissions(hostname, ctx.state.jwt.claims),
    (result) => {
      const body: GetPermissionsAPIResult = {
        permissions: result.value.permissions,
      };
      ctx.body = body;
    }
  );
}
