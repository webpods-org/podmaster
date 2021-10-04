import { logException } from "../lib/logger/index.js";
import { IKoaAppContext } from "../types/koa.js";
import { StatusCodes } from "http-status-codes";
import { HttpError } from "../types/index.js";
import { InvalidResult, ValidResult } from "../Result.js";

export async function handleResult<
  TClaims,
  TKoaAppContext extends IKoaAppContext<TClaims>,
  TResult
>(
  ctx: TKoaAppContext,
  fn: () => Promise<ValidResult<TResult> | InvalidResult<HttpError>>,
  then: (x: ValidResult<TResult>) => void,
  errorHandler?: (
    x: InvalidResult<HttpError>
  ) => { handled: boolean } | undefined
): Promise<void> {
  try {
    const result = await fn();
    if (result instanceof ValidResult) {
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
    ctx.status = StatusCodes.INTERNAL_SERVER_ERROR;
    ctx.body = { error: "Internal server error." };
  }
}

function ensureJwt<TClaims, TKoaAppContext extends IKoaAppContext<TClaims>>(
  ctx: TKoaAppContext
): ctx is TKoaAppContext & { state: { jwt: { claims: TClaims } } } {
  return (
    ctx.state !== undefined &&
    ctx.state.jwt !== undefined &&
    ctx.state.jwt.claims !== undefined
  );
}

export async function handleResultWithJwt<
  TClaims,
  TKoaAppContext extends IKoaAppContext<TClaims>,
  TResult
>(
  ctx: TKoaAppContext,
  fn: (
    ctx: TKoaAppContext & { state: { jwt: { claims: TClaims } } }
  ) => Promise<ValidResult<TResult> | InvalidResult<HttpError>>,
  then: (x: ValidResult<TResult>) => void,
  errorHandler?: (
    x: InvalidResult<HttpError>
  ) => { handled: boolean } | undefined
): Promise<void> {
  if (ensureJwt(ctx)) {
    return await handleResult(ctx, () => fn(ctx), then, errorHandler);
  } else {
    ctx.status = StatusCodes.UNAUTHORIZED;
    ctx.body = {
      error: "Missing JWT. Access Denied.",
    };
  }
}

function genericErrorHandler(
  ctx: IKoaAppContext<any>,
  result: InvalidResult<HttpError>
): void {
  ctx.status = result.error.status;
  ctx.body = {
    error: result.error.error,
  };
}
