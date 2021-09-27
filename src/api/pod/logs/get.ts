import getLogs from "../../../domain/logs/getLogs.js";
import { handleResultWithJwt } from "../../handleResult.js";
import { IKoaAppContext } from "../../../types/koa.js";

export type GetLogsAPIResult = {
  logs: {
    id: string;
    name: string;
    description: string;
  }[];
};

export default async function getAPI(ctx: IKoaAppContext): Promise<void> {
  const hostname = ctx.URL.hostname;

  await handleResultWithJwt(
    ctx,
    (ctx) => getLogs(hostname, ctx.state.jwt.claims),
    (result) => {
      const body: GetLogsAPIResult = {
        logs: result.value.logs,
      };
      ctx.body = body;
    }
  );
}
