import createLog from "../../domain/log/createLog.js";
import handleResult from "../handleResult.js";
import transformQuery from "../utils/transformQuery.js";
import { IKoaAppContext } from "../../types/koa.js";
import { ACCESS_DENIED } from "../../errors/codes.js";

export type CreateLogAPIResult = {
  name: string;
};

export default async function createLogAPI(ctx: IKoaAppContext): Promise<void> {
  const hostname = ctx.URL.hostname;

  await handleResult(
    ctx,
    () =>
      ctx.state.jwt?.claims.iss && ctx.state.jwt?.claims.sub
        ? createLog(
            ctx.state.jwt?.claims.iss,
            ctx.state.jwt?.claims.sub,
            hostname,
            ctx.request.body.name,
            transformQuery(ctx.request.body.public, (x) => !!x),
            ctx.request.body.tags
          )
        : Promise.resolve({
            ok: false,
            error: "Access Denied.",
            code: ACCESS_DENIED,
          }),
    (result) => {
      const body: CreateLogAPIResult = {
        name: result.value.name,
      };
      ctx.body = body;
    }
  );
}
