import send from "koa-send";
import handleResult from "../../../handleResult.js";
import { IKoaAppContext } from "../../../../types/koa.js";
import getLogFile from "../../../../domain/logs/files/getLogFile.js";
import * as config from "../../../../config/index.js";
import path from "path/posix";

export default async function item(ctx: IKoaAppContext): Promise<void> {
  const appConfig = config.get();
  const hostname = ctx.URL.hostname;

  await handleResult(
    ctx,
    () =>
      getLogFile(
        hostname,
        ctx.params.log,
        ctx.url,
        ctx.state.jwt?.claims
      ),
    async (result) => {
      await send(ctx, result.value.relativeFilePath, {
        root: path.join(appConfig.storage.dataDir, "pods"),
      });
    }
  );
}
