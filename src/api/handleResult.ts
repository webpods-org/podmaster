import { IRouterContext } from "koa-router";
import { UNKNOWN_ERROR } from "../errors/codes";
import { OkResult, Result } from "../types/api";

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
      ctx.status = 500;
      ctx.body = { error: result.error, code: result.code };
    }
  } catch (ex: any) {
    ctx.status = 500;
    ctx.body = { error: "Internal server error.", code: UNKNOWN_ERROR };
  }
}
