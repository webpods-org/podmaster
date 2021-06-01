import createLog from "../../domain/log/createLog";
import * as config from "../../config";
import { MISSING_POD, NOT_FOUND, UNKNOWN_ERROR } from "../../errors/codes";
import { IRouterContext } from "koa-router";
import addEntries from "../../domain/log/addEntries";

export type AddEntriesAPIResult = {};

export default async function addEntriesAPI(ctx: IRouterContext) {
  const appConfig = config.get();
  const hostname = ctx.URL.hostname;

  console.log(ctx.request.body);

  const result = await addEntries(
    ctx.state.jwt.claims.iss,
    ctx.state.jwt.claims.sub,
    hostname,
    ctx.request.body,
    ctx.request.files
  );
  if (result.success) {
    // const apiResult: AddEntriesAPIResult = {
    //   log: `${result.log}`,
    // };
    ctx.body = "hello";
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
