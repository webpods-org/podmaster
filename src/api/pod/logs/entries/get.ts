import getLogEntries from "../../../../domain/logs/entries/getLogEntries.js";
import transformQuery from "../../../../lib/http/transformQueryParam.js";
import { handleResult } from "../../../handleResult.js";
import getQueryParameter from "../../../../lib/http/getQueryParam.js";
import { LogEntry } from "../../../../types/index.js";
import { IKoaPodAppContext } from "../../../../types/koa.js";

export type GetLogEntriesAPIResult = {
  entries: LogEntry[];
};

export default async function getEntriesAPI(ctx: IKoaPodAppContext) {
  const hostname = ctx.URL.hostname;

  await handleResult(
    ctx,
    () =>
      getLogEntries(
        hostname,
        ctx.params.log,
        {
          sinceId: transformQuery(ctx.request.query.sinceId, parseInt),
          sinceCommit: getQueryParameter(ctx.request.query.sinceCommit),
          commits: getQueryParameter(ctx.request.query.commits),
          limit: transformQuery(ctx.request.query.limit, parseInt),
          offset: transformQuery(ctx.request.query.offset, parseInt),
          order: getQueryParameter(ctx.request.query.order),
        },
        ctx.state.jwt?.claims
      ),
    (result) => {
      const body: GetLogEntriesAPIResult = {
        entries: result.value.entries,
      };
      ctx.body = body;
    }
  );
}
