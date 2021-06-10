import handleResult from "../handleResult";
import { IKoaAppContext } from "../../types/koa";
import send = require("koa-send");
import getFile from "../../domain/log/getFile";

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
      await send(ctx, result.filePath, { root: result.root });
    }
  );
}
