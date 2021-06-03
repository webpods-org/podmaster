import { IRouterContext } from "koa-router";
import getEntries from "../../domain/log/getEntries";
import transformQuery from "../utils/transformQuery";
import handleResult from "../handleResult";
import getQuery from "../utils/getParam";

export type GetEntriesAPIResult = {
  entries: {
    id: number;
    commit: string;
    data: string;
  }[];
};

export default async function getEntriesAPI(ctx: IRouterContext) {
  const hostname = ctx.URL.hostname;

  await handleResult(
    ctx,
    () =>
      getEntries(
        ctx.state.jwt.claims.iss,
        ctx.state.jwt.claims.sub,
        hostname,
        ctx.params.log,
        transformQuery(ctx.request.query.fromId, parseInt),
        getQuery(ctx.request.query.fromCommit),
        getQuery(ctx.request.query.commits),
        transformQuery(ctx.request.query.count, parseInt)
      ),
    (result) => {
      const body: GetEntriesAPIResult = {
        entries: result.entries,
      };
      ctx.body = body;
    }
  );
}
