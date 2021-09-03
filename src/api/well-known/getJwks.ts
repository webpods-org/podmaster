import * as config from "../../config/index.js";
import { NOT_FOUND } from "../../errors/codes.js";
import { IKoaAppContext } from "../../types/koa.js";
import { JWK } from "../../types/types.js";

export type GetJwksAPIResult = {
  keys: JWK[];
};

export default async function getJwks(ctx: IKoaAppContext): Promise<void> {
  const appConfig = config.get();

  if (appConfig.jwks) {
    ctx.body = appConfig.jwks;
  } else {
    ctx.status = 404;
    ctx.body = {
      error: "Not found.",
      code: NOT_FOUND,
    };
  }
}
