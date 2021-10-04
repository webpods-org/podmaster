import * as config from "../../../config/index.js";
import { IKoaPodmasterAppContext } from "../../../types/koa.js";
import { JWK } from "../../../types/index.js";

export type GetJwksAPIResult = {
  keys: JWK[];
};

export default async function getJwks(
  ctx: IKoaPodmasterAppContext
): Promise<void> {
  const appConfig = config.get();

  const jwk = config.getPodmasterJWK();
  ctx.body = {
    keys: [jwk],
  };
}
