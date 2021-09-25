import { JwtClaims } from "../../types/index.js";

export default function validateClaims(
  claims: Record<string, any> | string
): claims is JwtClaims {
  return typeof claims === "object" &&
    (claims as any).iss &&
    (claims as any).sub &&
    claims.sub !== "*"
    ? true
    : false;
}
