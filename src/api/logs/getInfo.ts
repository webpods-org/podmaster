import handleResult from "../handleResult";
import getInfo from "../../domain/log/getInfo";
import { IKoaAppContext } from "../../types/koa";

export type GetInfoAPIResult = {
  count: number;
};

export default async function getEntriesAPI(ctx: IKoaAppContext) {
  const hostname = ctx.URL.hostname;

  await handleResult(
    ctx,
    () =>
      getInfo(
        ctx.state.jwt?.claims.iss,
        ctx.state.jwt?.claims.sub,
        hostname,
        ctx.params.log
      ),
    (result) => {
      const body: GetInfoAPIResult = {
        count: result.value.count,
      };
      ctx.body = body;
    }
  );
}
