import { handleResult } from "../../../handleResult.js";
import { IKoaPodmasterAppContext } from "../../../../types/koa.js";
import createAuthToken from "../../../../domain/oauth/createToken.js";

export type CreateAuthTokenAPIResult = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

export default async function createAPI(
  ctx: IKoaPodmasterAppContext
): Promise<void> {
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
    }
  );
}
