import { IRouterContext } from "koa-router";
import { JwtClaims } from "../../types/config";
import { getFieldValue } from "../../utils/http";
import { IVerifiedValidJwt, verify } from "../../utils/jwt";

export async function validateJwt(
  ctx: IRouterContext,
  then: (claims: JwtClaims) => void | Promise<void>
) {
  throw new Error("Not implemented.");
}
