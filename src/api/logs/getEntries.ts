import getEntries from "../../domain/log/getEntries.js";
import transformQuery from "../utils/transformQuery.js";
import handleResult from "../handleResult.js";
import getQuery from "../utils/getParam.js";
import { LogEntry } from "../../types/types.js";
import { IKoaAppContext } from "../../types/koa.js";

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
