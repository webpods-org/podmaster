import { IRouterContext } from "koa-router";
import getEntries from "../../domain/log/getEntries";
import transformQuery from "../utils/transformQuery";
import handleResult from "../handleResult";
import getQuery from "../utils/getParam";
import { LogEntry } from "../../types/types";
import { IKoaAppContext } from "../../types/koa";

export type GetEntriesAPIResult = {
  entries: LogEntry[];
};

export default async function getEntriesAPI(ctx: IKoaAppContext) {
  const hostname = ctx.URL.hostname;

  await handleResult(
    ctx,
    () =>
      getEntries(
        ctx.state.jwt?.claims.iss,
        ctx.state.jwt?.claims.sub,
        hostname,
        ctx.params.log,
        transformQuery(ctx.request.query.sinceId, parseInt),
        getQuery(ctx.request.query.sinceCommit),
        getQuery(ctx.request.query.commits),
        transformQuery(ctx.request.query.limit, parseInt)
      ),
    (result) => {
      const body: GetEntriesAPIResult = {
        entries: result.value.entries,
      };
      ctx.body = body;
    }
  );
}
