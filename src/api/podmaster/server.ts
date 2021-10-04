import Koa from "koa";
import Router from "koa-router";
import bodyParser from "koa-body";
import jwtMiddleware from "../../lib/jwt/middleware.js";
import * as podsApi from "./pods/index.js";
import * as wellKnownEndpoints from "./wellKnown/index.js";
import * as config from "../../config/index.js";
import * as authApi from "./oauth/index.js";
import cors from "@koa/cors";
import { JwtPayload } from "jsonwebtoken";
import { PodmasterJwtClaims } from "../../types/index.js";

const MEGABYTE = 1024 * 1024;

export default function setup() {
  const appConfig = config.get();
  const router = new Router();

  // pods
  router.post("/pods", podsApi.create);
  router.get("/pods", podsApi.get);

  //.well-known
  router.get("/.well-known/jwks.json", wellKnownEndpoints.jwks);
  router.get(
    "/.well-known/oauth-authorization-server",
    wellKnownEndpoints.oauthMetadata
  );

  // jwt
  router.post("/oauth/token", authApi.tokens.create);

  const koa = new Koa();
  koa.use(
    jwtMiddleware(
      { exclude: [/^\/\.well-known\//, /^\/oauth\//] },
      validateClaims
    )
  );
  koa.use(
    bodyParser({
      multipart: true,
      formidable: { maxFieldsSize: appConfig.maxFileSize || 8 * MEGABYTE },
    })
  );
  koa.use(router.routes());
  koa.use(router.allowedMethods());
  koa.use(cors());
  return koa.callback();
}

function validateClaims(
  claims: string | JwtPayload
): claims is PodmasterJwtClaims {
  return typeof claims === "object" &&
    (claims as any).iss &&
    (claims as any).sub &&
    (claims as any).aud &&
    claims.sub !== "*"
    ? true
    : false;
}
