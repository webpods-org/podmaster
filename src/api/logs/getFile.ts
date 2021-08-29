import send from "koa-send";
import handleResult from "../handleResult.js";
import { IKoaAppContext } from "../../types/koa.js";
import getFile from "../../domain/log/getFile.js";
import * as config from "../../config/index.js";
import path from "path/posix";

export default async function getFileAPI(ctx: IKoaAppContext): Promise<void> {
  const appConfig = config.get();
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
      await send(ctx, result.value.relativeFilePath, {
        root: path.join(appConfig.storage.dataDir, "pods"),
      });
    }
  );
}
