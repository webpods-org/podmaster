import { IRouterContext } from "koa-router";
import * as configModule from "../config";
import { authenticate } from "../domain/account";
import { setCookie } from "../utils/cookie";

export async function login(ctx: IRouterContext) {
  const config = configModule.get();

  const { userId, password } = ctx.body as any;
  const isValidLogin = await authenticate(userId, password);

  if (isValidLogin) {
    const data = {
      hello: "world",
    };

    ctx.body = {
      success: true,
      userId,
    };
  } else {
    ctx.body = {
      success: false,
    };
  }
}
