import { JwtClaims } from "../../types/types.js";

export default function validateClaims(
  claims: object | string
): claims is JwtClaims {
  return typeof claims === "object" &&
    (claims as any).iss &&
    (claims as any).sub
    ? true
    : false;
}
