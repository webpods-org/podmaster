import { JwtClaims } from "../../types/index.js";

export function ensureJwt(
  jwt: { claims: Record<string, any> } | undefined
): jwt is { claims: JwtClaims } {
  return jwt !== undefined && jwt.claims !== undefined;
}
