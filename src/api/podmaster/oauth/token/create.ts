import { handleResult } from "../../../handleResult.js";
import { IKoaAppContext } from "../../../../types/koa.js";
import errors from "../../../../errors/codes.js";
import createAuthToken from "../../../../domain/oauth/createToken.js";

export type CreateAuthTokenAPIResult = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

export default async function createAPI(ctx: IKoaAppContext): Promise<void> {
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
      if (err.code === errors.OAuth.UNSUPPORTED_GRANT_TYPE) {
        ctx.status = 400;
        ctx.body = {
          error:
            "Incorrect grant_type. Supported value is 'urn:ietf:params:oauth:grant-type:jwt-bearer'.",
          code: errors.OAuth.UNSUPPORTED_GRANT_TYPE,
        };
        return { handled: true };
      } else {
        return { handled: false };
      }
    }
  );
}
