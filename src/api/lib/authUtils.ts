import { IRouterContext } from "koa-router";
import { JwtClaims } from "../../types/config";
import { getFieldValue } from "../../utils/http";
import { IVerifiedValidJwt, verify } from "../../utils/jwt";

export async function validateJwt(
  ctx: IRouterContext,
  then: (claims: JwtClaims) => void | Promise<void>
) {
  const jwt = getFieldValue(ctx.headers["border-patrol-jwt"]);

  return !jwt
    ? /* JWT was missing */
      ((ctx.status = 400),
      (ctx.body =
        "Missing JWT token in request. Pass via cookies or in the header."))
    : await (async () => {
        const result = verify(jwt);
        return !result.valid
          ? /* Invalid JWT */
            ((ctx.status = 400), (ctx.body = "Invalid JWT token."))
          : await then(result);
      })();
}

export async function ensureUserId(
  ctx: IRouterContext,
  then: (
    userId: string,
    verifiedJwt: IVerifiedValidJwt,
    args: { jwt: string }
  ) => Promise<any>
) {
  return validateJwt(ctx, async (verfiedJwt, args) => {
    const userId = verfiedJwt.value.userId;
    return !userId
      ? ((ctx.status = 400),
        (ctx.body = "User id was not found in the JWT token."))
      : await then(userId, verfiedJwt, args);
  });
}
