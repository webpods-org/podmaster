import Koa from "koa";
import Router from "koa-router";
import bodyParser from "koa-body";
import jwtMiddleware from "../../lib/jwt/middleware.js";
import * as logsApi from "./logs/index.js";
import * as permissionsApi from "./permissions/index.js";
import * as permissionTokensApi from "./permissionsTokens/index.js";
import * as config from "../../config/index.js";

const MEGABYTE = 1024 * 1024;

export default function setup() {
  const appConfig = config.get();

  const router = new Router();

  // permissions
  router.get("/permissions", permissionsApi.get);
  router.post("/permissions", permissionsApi.add);
  router.del("/permissions", permissionsApi.remove);

  // permission tokens. Can be exchanged for a permission later by holder.
  router.get("/permission-tokens", permissionTokensApi.get);
  router.post("/permission-tokens", permissionTokensApi.create);
  router.post("/permission-tokens/:id", permissionTokensApi.redeem);
  router.del("/permission-tokens/:id", permissionTokensApi.remove);

  // logs
  router.get("/logs", logsApi.get);
  router.post("/logs", logsApi.create);
  router.get("/logs/:log/info", logsApi.info.get);
  router.get("/logs/:log/entries", logsApi.entries.get);
  router.post("/logs/:log/entries", logsApi.entries.add);
  router.get("/logs/:log/files/(.*)", logsApi.files.item);

  const koa = new Koa();
  koa.use(jwtMiddleware({ exclude: [/^\/channels$/] }));
  koa.use(
    bodyParser({
      multipart: true,
      formidable: { maxFieldsSize: appConfig.maxFileSize || 8 * MEGABYTE },
    })
  );
  koa.use(router.routes());
  koa.use(router.allowedMethods());
  return koa.callback();
}
