import { IRouterContext } from "koa-router";
import { ACCESS_DENIED, UNKNOWN_ERROR } from "../errors/codes.js";
import { log, logException } from "../lib/logger/log.js";
import { OkResult, Result } from "../types/api.js";

export default async function handleResult<T>(
  ctx: IRouterContext,
  fn: () => Promise<Result<T>>,
  then: (x: OkResult<T>) => void
) {
  try {
    const result = await fn();
    if (result.ok) {
      return then(result);
    } else {
      if (result.code === ACCESS_DENIED) {
        ctx.status = 401;
        ctx.body = {
          error: "Access denied.",
          code: ACCESS_DENIED,
        };
      } else {
        ctx.status = 500;
        ctx.body = { error: result.error, code: result.code };
      }
    }
  } catch (ex: any) {
    logException(ex);
    ctx.status = 500;
    ctx.body = { error: "Internal server error.", code: UNKNOWN_ERROR };
  }
}
