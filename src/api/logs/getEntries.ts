import getEntries from "../../domain/log/getEntries.js";
import transformQuery from "../utils/transformQuery.js";
import handleResult from "../handleResult.js";
import getQuery from "../utils/getParam.js";
import { LogEntry } from "../../types/types.js";
import { IKoaAppContext } from "../../types/koa.js";

export type GetEntriesAPIResult = {
  entries: LogEntry[];
};

export default async function getEntriesAPI(
  ctx: IKoaAppContext
): Promise<void> {
  const hostname = ctx.URL.hostname;

  await handleResult(
    ctx,
    () =>
      getEntries(
        hostname,
        ctx.params.log,
        {
          sinceId: transformQuery(ctx.request.query.sinceId, parseInt),
          sinceCommit: getQuery(ctx.request.query.sinceCommit),
          commits: getQuery(ctx.request.query.commits),
          limit: transformQuery(ctx.request.query.limit, parseInt),
          offset: transformQuery(ctx.request.query.offset, parseInt),
          order: getQuery(ctx.request.query.order),
        },
        ctx.state.jwt?.claims
      ),
    (result) => {
      const body: GetEntriesAPIResult = {
        entries: result.value.entries,
      };
      ctx.body = body;
    }
  );
}
