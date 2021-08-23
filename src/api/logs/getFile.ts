import send from "koa-send";
import handleResult from "../handleResult.js";
import { IKoaAppContext } from "../../types/koa.js";
import getFile from "../../domain/log/getFile.js";

export default async function getFileAPI(ctx: IKoaAppContext) {
  const hostname = ctx.URL.hostname;

  await handleResult(
    ctx,
    () =>
      getFile(
        ctx.state.jwt?.claims.iss,
        ctx.state.jwt?.claims.sub,
        hostname,
        ctx.params.log,
        ctx.url
      ),
    async (result) => {
      await send(ctx, result.value.filePath, { root: result.value.root });
    }
  );
}
