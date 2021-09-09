import Koa from "koa";
import Router from "koa-router";
import bodyParser from "koa-body";
import jwtMiddleware from "../../lib/jwt/middleware.js";
import * as podsApi from "./pods/index.js";
import * as wellKnownEndpoints from "./well-known/index.js";
import * as config from "../../config/index.js";

const MEGABYTE = 1024 * 1024;

export default function setup() {
  const appConfig = config.get();
  const podMasterRouter = new Router();

  // pods
  podMasterRouter.post("/pods", podsApi.add);
  podMasterRouter.get("/pods", podsApi.get);

  //.well-known
  podMasterRouter.get("/.well-known/jwks.json", wellKnownEndpoints.jwks.get);

  const koaPodmaster = new Koa();
  koaPodmaster.use(jwtMiddleware({ exclude: [/^\/\.well-known\//] }));
  koaPodmaster.use(
    bodyParser({
      multipart: true,
      formidable: { maxFieldsSize: appConfig.maxFileSize || 8 * MEGABYTE },
    })
  );
  koaPodmaster.use(podMasterRouter.routes());
  koaPodmaster.use(podMasterRouter.allowedMethods());
  return koaPodmaster.callback();
}
