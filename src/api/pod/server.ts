import Koa from "koa";
import Router from "koa-router";
import bodyParser from "koa-body";
import jwtMiddleware from "../../lib/jwt/middleware.js";
import * as logsApi from "./logs/index.js";
import * as permissionsApi from "./permissions/index.js";
import * as config from "../../config/index.js";

const MEGABYTE = 1024 * 1024;

export default function setup() {
  const appConfig = config.get();

  /* POD ROUTES */
  const podsRouter = new Router();
  podsRouter.get("/permissions", permissionsApi.getPermissionsAPI);
  podsRouter.post("/permissions/updates", permissionsApi.updatePermissionsAPI);

  // logs
  podsRouter.get("/logs", logsApi.getLogsAPI);
  podsRouter.post("/logs", logsApi.createLogAPI);
  podsRouter.get("/logs/:log/info", logsApi.getInfoAPI);
  podsRouter.get("/logs/:log/entries", logsApi.getEntriesAPI);
  podsRouter.post("/logs/:log/entries", logsApi.addEntriesAPI);
  podsRouter.get("/logs/:log/permissions", logsApi.getPermissionsAPI);
  podsRouter.post("/logs/:log/permissions/updates", logsApi.updatePermissions);
  podsRouter.get("/logs/:log/files/(.*)", logsApi.getFile);

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
