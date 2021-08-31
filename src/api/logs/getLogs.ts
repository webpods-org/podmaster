import getLogs from "../../domain/log/getLogs.js";
import handleResult from "../handleResult.js";
import { IKoaAppContext } from "../../types/koa.js";
import { ACCESS_DENIED } from "../../errors/codes.js";

export type GetLogsAPIResult = {
  logs: {
    id: string;
    name: string;
    description: string;
  }[];
};

export default async function getLogsAPI(ctx: IKoaAppContext): Promise<void> {
  const hostname = ctx.URL.hostname;

  await handleResult(
    ctx,
    () =>
      ctx.state.jwt?.claims.iss && ctx.state.jwt?.claims.sub
        ? getLogs(
            hostname,
            ctx.state.jwt?.claims
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
