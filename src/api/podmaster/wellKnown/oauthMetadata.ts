import * as config from "../../../config/index.js";
import { IKoaPodmasterAppContext } from "../../../types/koa.js";

export type GetOAuthMetadataAPIResult = {
  issuer: string;
  token_endpoint: string;
  jwks_uri: string;
  grant_types_supported: string[];
};

export default async function getJwks(
  ctx: IKoaPodmasterAppContext
): Promise<void> {
  const appConfig = config.get();

  ctx.body = {
    issuer: `https://${appConfig.hostname}/`,
    token_endpoint: `https://${appConfig.hostname}/oauth/token`,
    jwks_uri: `https:/${appConfig.hostname}/.well-known/jwks.json`,
    grant_types_supported: ["jwt-bearer-exchange"],
  };
}
