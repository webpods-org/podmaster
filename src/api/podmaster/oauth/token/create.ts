import handleResult from "../../../handleResult.js";
import { IKoaAppContext } from "../../../../types/koa.js";
import {
  ACCESS_DENIED,
  NOT_FOUND,
  OAUTH_UNSUPPORTED_GRANT_TYPE,
} from "../../../../errors/codes.js";
import { ensureJwt } from "../../../utils/ensureJwt.js";
import createAuthToken from "../../../../domain/oauth/createToken.js";
import * as config from "../../../../config/index.js";

export type CreateAuthTokenAPIResult = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

export default async function createAPI(ctx: IKoaAppContext): Promise<void> {
  const appConfig = config.get();
  const hostname = ctx.URL.hostname;
  if (hostname === appConfig.hostname) {
    await handleResult(
      ctx,
      () =>
        createAuthToken(
          ctx.request.body.grant_type,
          ctx.request.body.assertion,
          ctx.request.body.aud
        ),
      (result) => {
        const body: CreateAuthTokenAPIResult = {
          access_token: result.value.access_token,
          token_type: result.value.token_type,
          expires_in: result.value.expires_in,
        };
        ctx.body = body;
      },
      (err) => {
        if (err.code === OAUTH_UNSUPPORTED_GRANT_TYPE) {
          ctx.status = 400;
          ctx.body = {
            error:
              "Incorrect grant_type. Supported value is 'urn:ietf:params:oauth:grant-type:jwt-bearer'.",
            code: OAUTH_UNSUPPORTED_GRANT_TYPE,
          };
          return { handled: true };
        } else {
          return { handled: false };
        }
      }
    );
  } else {
    ctx.status = 404;
    ctx.body = {
      error: "Not found.",
      code: NOT_FOUND,
    };
  }
}
