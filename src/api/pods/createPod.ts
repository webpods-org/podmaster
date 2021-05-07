import { IRouterContext } from "koa-router";
import createPod from "../../domain/pod/createPod";
import * as config from "../../config";

export default async function createPodAPI(ctx: IRouterContext) {
  const appConfig = config.get();
  const hostname = ctx.URL.hostname;
  if (hostname === appConfig.hostname) {
    const result = await createPod(ctx.state.jwt.claims);
  } else {
    ctx.status = 404;
    ctx.body = "Not found";
  }
}
