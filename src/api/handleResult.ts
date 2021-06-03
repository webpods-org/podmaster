import { IRouterContext } from "koa-router";
import DomainError from "../domain/DomainError";
import { UNKNOWN_ERROR } from "../errors/codes";

export default async function handleResult<T>(
  ctx: IRouterContext,
  fn: () => Promise<T>
) {
  try {
    return await fn();
  } catch (ex: any) {
    if (ex instanceof DomainError) {
      ctx.status = 500;
      ctx.body = { error: ex.message, code: ex.code };
    } else {
      ctx.status = 500;
      ctx.body = { error: "Internal server error.", code: UNKNOWN_ERROR };
    }
  }
}
