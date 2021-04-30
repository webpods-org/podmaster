import { IRouterContext } from "koa-router";
import { validateJwt } from "../lib/authUtils";

export default async function createPod(ctx: IRouterContext) {
  validateJwt(ctx, async (jwt) => {
    const hostname = ctx.URL.hostname;
    
  });
}
