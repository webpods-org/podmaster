import { JwtPayload } from "jsonwebtoken";

export function claimsFieldIsObject(
  claims: string | JwtPayload
): claims is JwtPayload {
  return typeof claims === "object";
}
