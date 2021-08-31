import { JwtClaims, UncheckedJwtClaims } from "../../types/types.js";

/*
  If exp is missing, assume it's valid for iat + 300 seconds.
  300s is totally arbitrary, but seems like a good compromise.
*/
export function checkExp(claims: UncheckedJwtClaims) {
  const now = Date.now();
  return (
    (!claims.exp && claims.iat && (claims.iat + 300) * 1000 > now) ||
    (claims.exp && claims.exp * 1000 > now)
  );
}

export function checkNbf(claims: UncheckedJwtClaims) {
  const now = Date.now();
  return !claims.nbf || now > claims.nbf * 1000;
}

export function checkAud(claims: UncheckedJwtClaims, hostname: string) {
  return (
    claims.aud === hostname ||
    (Array.isArray(claims.aud) && claims.aud.includes(hostname))
  );
}
