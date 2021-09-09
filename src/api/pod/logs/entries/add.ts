import addEntries from "../../../../domain/log/addEntries.js";
import { ACCESS_DENIED } from "../../../../errors/codes.js";
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
        ? addEntries(
            hostname,
            ctx.params.log,
            ctx.request.body.entries,
            ctx.request.files,
            ctx.state.jwt.claims
          )
        : Promise.resolve({
            ok: false,
            error: "Access Denied.",
            code: ACCESS_DENIED,
          }),
    (result) => {
      const body: AddLogEntriesAPIResult = {
        entries: result.value.entries,
      };
      ctx.body = body;
    }
  );
}
