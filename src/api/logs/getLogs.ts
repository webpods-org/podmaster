import getLogs from "../../domain/log/getLogs.js";
import handleResult from "../handleResult.js";
import { IKoaAppContext } from "../../types/koa.js";
import { ACCESS_DENIED } from "../../errors/codes.js";

export type GetLogsAPIResult = {
  logs: {
    name: string;
  }[];
};

export default async function getLogsAPI(ctx: IKoaAppContext): Promise<void> {
  const hostname = ctx.URL.hostname;

  await handleResult(
    ctx,
    () =>
      ctx.state.jwt?.claims.iss && ctx.state.jwt?.claims.sub
        ? getLogs(
            ctx.state.jwt?.claims.iss,
            ctx.state.jwt?.claims.sub,
            hostname,
            ctx.request.body.tags
          )
        : Promise.resolve({
            ok: false,
            error: "Access Denied.",
            code: ACCESS_DENIED,
          }),
    (result) => {
      const body: GetLogsAPIResult = {
        logs: result.value.logs,
      };
      ctx.body = body;
    }
  );
}
