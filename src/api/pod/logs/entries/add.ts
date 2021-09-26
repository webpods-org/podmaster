import addLogEntries from "../../../../domain/logs/entries/addLogEntries.js";
import errors from "../../../../errors/codes.js";
import { IKoaAppContext } from "../../../../types/koa.js";
import handleResult from "../../../handleResult.js";
import { ensureJwt } from "../../../utils/ensureJwt.js";

export type AddLogEntriesAPIResult = {
  entries: {
    id: number;
    commit: string;
  }[];
};

export default async function addAPI(
  ctx: IKoaAppContext
): Promise<void> {
  const hostname = ctx.URL.hostname;

  await handleResult(
    ctx,
    () =>
      ensureJwt(ctx.state.jwt)
        ? addLogEntries(
            hostname,
            ctx.params.log,
            ctx.request.body.entries,
            ctx.request.files,
            ctx.state.jwt.claims
          )
        : Promise.resolve({
            ok: false,
            error: "Access Denied.",
            code: errors.ACCESS_DENIED,
          }),
    (result) => {
      const body: AddLogEntriesAPIResult = {
        entries: result.value.entries,
      };
      ctx.body = body;
    }
  );
}
