import errors from "../errors/codes.js";
import { logException } from "../lib/logger/index.js";
import { ErrResult, OkResult, Result } from "../types/api.js";
import { IKoaAppContext } from "../types/koa.js";
import { StatusCodes } from "http-status-codes";
import { JwtClaims } from "../types/index.js";

export async function handleResult<T>(
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

function ensureJwt(
  jwt: { claims: Record<string, any> } | undefined
): jwt is { claims: JwtClaims } {
  return jwt !== undefined && jwt.claims !== undefined;
}

export async function handleResultWithJwt<T>(
  ctx: IKoaAppContext,
  fn: (
    ctx: IKoaAppContext & { state: { jwt: JwtClaims } }
  ) => Promise<Result<T>>,
  then: (x: OkResult<T>) => void,
  errorHandler?: (x: ErrResult) => { handled: boolean } | undefined
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
