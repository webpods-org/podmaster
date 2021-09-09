import handleResult from "../../../handleResult.js";
import getLogInfo from "../../../../domain/logs/info/getLogInfo.js";
import { IKoaAppContext } from "../../../../types/koa.js";

export type GetLogInfoAPIResult = {
  id: number;
  commit: string;
};

export default async function getAPI(
  ctx: IKoaAppContext
): Promise<void> {
  const hostname = ctx.URL.hostname;

  await handleResult(
    ctx,
    () => getLogInfo(hostname, ctx.params.log, ctx.state.jwt?.claims),
    (result) => {
      const body: GetLogInfoAPIResult = {
        id: result.value.id,
        commit: result.value.commit,
      };
      ctx.body = body;
    }
  );
}
