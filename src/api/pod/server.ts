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

  const podsRouter = new Router();

  // permissions
  podsRouter.get("/permissions", permissionsApi.get);
  podsRouter.post("/permissions", permissionsApi.add);
  podsRouter.del("/permissions", permissionsApi.remove);

  // permission tokens. Can be exchanged for a permission later by holder.
  podsRouter.get("/permission-tokens", permissionTokensApi.get);
  podsRouter.post("/permission-tokens", permissionTokensApi.add);
  podsRouter.post("/permission-tokens/:id", permissionTokensApi.redeem);
  podsRouter.del("/permission-tokens/:id", permissionTokensApi.remove);

  // logs
  podsRouter.get("/logs", logsApi.get);
  podsRouter.post("/logs", logsApi.add);
  podsRouter.get("/logs/:log/info", logsApi.info.get);
  podsRouter.get("/logs/:log/entries", logsApi.entries.get);
  podsRouter.post("/logs/:log/entries", logsApi.entries.add);
  podsRouter.get("/logs/:log/files/(.*)", logsApi.files.item);

  const koaPod = new Koa();
  koaPod.use(jwtMiddleware({ exclude: [/^\/channels$/] }));
  koaPod.use(
    bodyParser({
      multipart: true,
      formidable: { maxFieldsSize: appConfig.maxFileSize || 8 * MEGABYTE },
    })
  );
  koaPod.use(podsRouter.routes());
  koaPod.use(podsRouter.allowedMethods());
  return koaPod.callback();
}
