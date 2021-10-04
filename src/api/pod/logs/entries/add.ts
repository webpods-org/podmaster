import addLogEntries from "../../../../domain/logs/entries/addLogEntries.js";
import { IKoaPodAppContext } from "../../../../types/koa.js";
import { handleResultWithJwt } from "../../../handleResult.js";

export type AddLogEntriesAPIResult = {
  entries: {
    id: number;
    commit: string;
  }[];
};

export default async function addAPI(ctx: IKoaPodAppContext): Promise<void> {
  const hostname = ctx.URL.hostname;

  await handleResultWithJwt(
    ctx,
    (ctx) => addLogEntries(
      hostname,
      ctx.params.log,
      ctx.request.body.entries,
      ctx.request.files,
      ctx.state.jwt.claims
    ),
    (result) => {
      const body: AddLogEntriesAPIResult = {
        entries: result.value.entries,
      };
      ctx.body = body;
    }
  );
}
