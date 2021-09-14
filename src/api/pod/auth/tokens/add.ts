import addLog from "../../../../domain/logs/addLog.js";
import handleResult from "../../../handleResult.js";
import transformQuery from "../../../utils/transformQuery.js";
import { IKoaAppContext } from "../../../../types/koa.js";
import { ACCESS_DENIED } from "../../../../errors/codes.js";
import { ensureJwt } from "../../../utils/ensureJwt.js";

export type AddLogAPIResult = {};

export default async function addToken(ctx: IKoaAppContext): Promise<void> {
  const hostname = ctx.URL.hostname;

  await handleResult(
    ctx,
    () =>
      ensureJwt(ctx.state.jwt)
        ? addLog(
            hostname,
            ctx.request.body.id,
            ctx.request.body.name,
            ctx.request.body.description,
            transformQuery(ctx.request.body.public, (x) => !!x),
            ctx.state.jwt.claims
          )
        : Promise.resolve({
            ok: false,
            error: "Access Denied.",
            code: ACCESS_DENIED,
          }),
    (result) => {
      const body: AddLogAPIResult = {};
      ctx.body = body;
    }
  );
}
