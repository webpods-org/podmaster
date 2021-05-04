import { IRouterContext } from "koa-router";
import { validateJwt } from "../lib/authUtils";
import createPod from "../../domain/pod/createPod";
import * as config from "../../config";

export default async function createPodAPI(ctx: IRouterContext) {
  const appConfig = config.get();
  const hostname = ctx.URL.hostname;  
  if (hostname === appConfig.hostname) {
    validateJwt(ctx, async (claims) => {
      const result = await createPod(claims);
    });
  } else {
    ctx.status = 404;
    ctx.body = "Not found";
  }
}
