import { IRouterContext } from "koa-router";
import addEntries from "../../domain/log/addEntries";
import handleResult from "../handleResult";

export type AddEntriesAPIResult = {
  entries: {
    id: number;
    commitId: string;
  }[];
};

export default async function addEntriesAPI(ctx: IRouterContext) {
  const hostname = ctx.URL.hostname;

 await handleResult(ctx, () =>
    addEntries(
      ctx.state.jwt.claims.iss,
      ctx.state.jwt.claims.sub,
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
