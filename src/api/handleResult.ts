import { IRouterContext } from "koa-router";
import { ACCESS_DENIED, UNKNOWN_ERROR } from "../errors/codes.js";
import { logException } from "../lib/logger/log.js";
import { ErrResult, OkResult, Result } from "../types/api.js";

export default async function handleResult<T>(
  ctx: IRouterContext,
  fn: () => Promise<Result<T>>,
  then: (x: OkResult<T>) => void,
  errorHandler?: (x: ErrResult) => { handled: boolean }
): Promise<void> {
  try {
    const result = await fn();
    if (result.ok) {
      return then(result);
    } else {
      if (errorHandler) {
        const { handled } = errorHandler(result);
        if (!handled) {
          return genericErrorHandler(ctx, result);
        }
      } else {
        return genericErrorHandler(ctx, result);
      }
    }
  } catch (ex: any) {
    logException(ex);
    ctx.status = 500;
    ctx.body = { error: "Internal server error.", code: UNKNOWN_ERROR };
  }
}

function genericErrorHandler(ctx: IRouterContext, result: ErrResult): void {
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
