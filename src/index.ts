#!/usr/bin/env node

import Koa = require("koa");
import mount = require("koa-mount");
import Router = require("koa-router");
import bodyParser = require("koa-bodyparser");
import yargs = require("yargs");
import { join } from "path";

import * as db from "./db";
import * as jwt from "./utils/jwt";
import { IAppConfig, IJwtConfig } from "./types";
import { login } from "./api/account";
import { health } from "./api/sys/health";

import * as config from "./config";
import * as jwtConfig from "./config/jwt";
import * as pgConfig from "./config/pg";

const packageJson = require("../package.json");

const argv = yargs.options({
  c: { type: "string", alias: "config" },
  p: { type: "number", default: 8080, alias: "port" },
  v: { type: "boolean", alias: "version" },
}).argv;

export async function startApp(port: number, configDir: string) {
  const appSettings: IAppConfig = require(join(configDir, "app.js"));
  const dbSettings = require(join(configDir, "pg.js"));
  const jwtSettings: IJwtConfig = require(join(configDir, "jwt.js"));

  // init configuration
  config.init(appSettings);
  jwtConfig.init(jwtSettings);
  pgConfig.init(dbSettings);

  // init the db library
  db.init();

  // Set up routes
  const router = new Router();

  router.post("/login", login);
  router.get("/sys/health", health);

  // Start app
  var app = new Koa();
  app.use(bodyParser());
  app.use(router.routes());
  app.use(router.allowedMethods());

  app.listen(port);

  return app;
}

if (require.main === module) {
  // Print the version and exit
  if (argv.v) {
    console.log(packageJson.version);
  } else {
    if (!argv.p) {
      console.log("The port should be specified with the -p option.");
      process.exit(1);
    }

    if (!argv.c) {
      console.log(
        "The configuration directory should be specified with the -c option."
      );
      process.exit(1);
    }

    const configDir = argv.c;
    const port = argv.p;

    startApp(port, configDir);
    console.log(`listening on port ${port}`);
  }
}
