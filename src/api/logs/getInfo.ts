import { IRouterContext } from "koa-router";
import getEntries from "../../domain/log/getEntries";
import transformQuery from "../utils/transformQuery";
import handleResult from "../handleResult";
import getQuery from "../utils/getParam";
import { LogEntry, Notifier } from "../../types/types";
import getInfo from "../../domain/log/getInfo";
import { IKoaAppContext } from "../../types/koa";

export type GetInfoAPIResult = {
  count: number;
  notifiers: Notifier[];
};

export default async function getEntriesAPI(ctx: IKoaAppContext) {
  const hostname = ctx.URL.hostname;

  await handleResult(
    ctx,
    () =>
      getInfo(
        ctx.state.jwt?.claims.iss,
        ctx.state.jwt?.claims.sub,
        hostname,
        ctx.params.log
      ),
    (result) => {
      const body: GetInfoAPIResult = {
        count: result.count,
        notifiers: result.notifiers,
      };
      ctx.body = body;
    }
  );
}
