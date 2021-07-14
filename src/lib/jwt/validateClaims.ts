import { JwtClaims } from "../../types/types";

export default function validateClaims(
  claims: object | string
): claims is JwtClaims {
  return (
    typeof claims === "object" && (claims as any).iss && (claims as any).sub
  );
}
