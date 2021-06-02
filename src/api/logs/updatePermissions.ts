import createLog from "../../domain/log/createLog";
import * as config from "../../config";
import { MISSING_POD, NOT_FOUND, UNKNOWN_ERROR } from "../../errors/codes";
import { IRouterContext } from "koa-router";
import addEntries from "../../domain/log/addEntries";

export type AddEntriesAPIResult = {
  entries: {
    id: number;
    commitId: string;
  }[];
};

export default async function addEntriesAPI(ctx: IRouterContext) {
  const appConfig = config.get();
  const hostname = ctx.URL.hostname;

  const result = await addEntries(
    ctx.state.jwt.claims.iss,
    ctx.state.jwt.claims.sub,
    hostname,
    ctx.params.log,
    ctx.request.body.entries,
    ctx.request.files
  );
  if (result.success) {
    ctx.body = result;
  } else {
    if (result.code === MISSING_POD) {
      ctx.status = 500;
      ctx.body = result;
    } else {
      ctx.status = 500;
      ctx.body = { error: "Internal server error.", code: UNKNOWN_ERROR };
    }
  }
}
