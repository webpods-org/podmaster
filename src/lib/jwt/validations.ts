import { JwtPayload } from "jsonwebtoken";

/*
  If exp is missing, assume it's valid for iat + 300 seconds.
  300s is totally arbitrary, but seems like a good compromise.
*/
export function checkExp(claims: JwtPayload) {
  const now = Date.now();
  return (
    (!claims.exp && claims.iat && (claims.iat + 300) * 1000 > now) ||
    (claims.exp && claims.exp * 1000 > now)
  );
}

export function checkNbf(claims: JwtPayload) {
  const now = Date.now();
  return !claims.nbf || now > claims.nbf * 1000;
}

export function checkAud(claims: JwtPayload, hostnames: string[]) {
  const aud: string | string[] | undefined = claims.aud;

  return (
    (typeof aud === "string" && hostnames.includes(aud)) ||
    (Array.isArray(aud) && hostnames.some((hostname) => aud.includes(hostname)))
  );
}
