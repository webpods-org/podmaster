import errors from "../errors/codes.js";
import { logException } from "../lib/logger/index.js";
import { IKoaAppContext } from "../types/koa.js";
import { StatusCodes } from "http-status-codes";
import { JwtClaims } from "../types/index.js";
import { InvalidResult, ValidResult } from "../Result.js";
import { HttpError } from "../utils/http.js";

export async function handleResult<T>(
  ctx: IKoaAppContext,
  fn: () => Promise<ValidResult<T> | InvalidResult<HttpError>>,
  then: (x: ValidResult<T>) => void,
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
    ctx.body = { error: "Internal server error.", code: errors.INTERNAL_ERROR };
  }
}

function ensureJwt(
  jwt: { claims: Record<string, any> } | undefined
): jwt is { claims: JwtClaims } {
  return jwt !== undefined && jwt.claims !== undefined;
}

export async function handleResultWithJwt<T>(
  ctx: IKoaAppContext,
  fn: (
    ctx: IKoaAppContext & { state: { jwt: JwtClaims } }
  ) => Promise<ValidResult<T> | InvalidResult<HttpError>>,
  then: (x: ValidResult<T>) => void,
  errorHandler?: (
    x: InvalidResult<HttpError>
  ) => { handled: boolean } | undefined
): Promise<void> {
  if (ensureJwt(ctx.state.jwt)) {
    return await handleResult(
      ctx,
      () => fn(ctx as IKoaAppContext & { state: { jwt: JwtClaims } }),
      then,
      errorHandler
    );
  } else {
    ctx.status = StatusCodes.UNAUTHORIZED;
    ctx.body = {
      error: "Missing JWT. Access Denied.",
    };
  }
}

function genericErrorHandler(
  ctx: IKoaAppContext,
  result: InvalidResult<HttpError>
): void {
  ctx.status = result.error.status;
  ctx.body = {
    error: result.error.error,
  };
}
