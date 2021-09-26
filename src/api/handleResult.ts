import errors from "../errors/codes.js";
import { logException } from "../lib/logger/index.js";
import { ErrResult, OkResult, Result } from "../types/api.js";
import { IKoaAppContext } from "../types/koa.js";

export default async function handleResult<T>(
  ctx: IKoaAppContext,
  fn: () => Promise<Result<T>>,
  then: (x: OkResult<T>) => void,
  errorHandler?: (x: ErrResult) => { handled: boolean } | undefined
): Promise<void> {
  try {
    const result = await fn();
    if (result.ok) {
      return then(result);
    } else {
      if (errorHandler) {
        const handlerResult = errorHandler(result);
        if (!handlerResult || !handlerResult.handled) {
          return genericErrorHandler(ctx, result);
        }
      } else {
        return genericErrorHandler(ctx, result);
      }
    }
  } catch (ex: any) {
    logException(ex);
    ctx.status = 500;
    ctx.body = { error: "Internal server error.", code: errors.INTERNAL_ERROR };
  }
}

function genericErrorHandler(ctx: IKoaAppContext, result: ErrResult): void {
  if (result.code === errors.ACCESS_DENIED) {
    ctx.status = 401;
    ctx.body = {
      error: "Access denied.",
      code: errors.ACCESS_DENIED,
    };
  } else {
    ctx.status = 500;
    ctx.body = { error: result.error, code: result.code };
  }
}
