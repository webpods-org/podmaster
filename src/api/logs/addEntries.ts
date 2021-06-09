import addEntries from "../../domain/log/addEntries";
import { IKoaAppContext } from "../../types/koa";
import handleResult from "../handleResult";

export type AddEntriesAPIResult = {
  entries: {
    id: number;
    commit: string;
  }[];
};

export default async function addEntriesAPI(ctx: IKoaAppContext) {
  const hostname = ctx.URL.hostname;

  await handleResult(
    ctx,
    () =>
      addEntries(
        ctx.state.jwt?.claims.iss,
        ctx.state.jwt?.claims.sub,
        hostname,
        ctx.params.log,
        ctx.request.body.entries,
        ctx.request.files
      ),
    (result) => {
      const body: AddEntriesAPIResult = {
        entries: result.entries,
      };
      ctx.body = body;
    }
  );
}
