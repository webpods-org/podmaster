import addLog from "../../../domain/logs/createLog.js";
import { handleResultWithJwt } from "../../handleResult.js";
import transformQuery from "../../utils/transformQuery.js";
import { IKoaPodAppContext } from "../../../types/koa.js";

export type CreateLogAPIResult = {};

export default async function addAPI(ctx: IKoaPodAppContext): Promise<void> {
  const hostname = ctx.URL.hostname;

  await handleResultWithJwt(
    ctx,
    (ctx) =>
      addLog(
        hostname,
        ctx.request.body.id,
        ctx.request.body.name,
        ctx.request.body.description,
        transformQuery(ctx.request.body.public, (x) => !!x),
        ctx.state.jwt.claims
      ),
    (result) => {
      const body: CreateLogAPIResult = {};
      ctx.body = body;
    }
  );
}
