import validateClaims from "./validateClaims.js";
import { checkAud, checkExp, checkNbf } from "./validations.js";
import jsonwebtoken from "jsonwebtoken";
import { JWKInfo } from "./getJwtValidationParams.js";
import { JwtClaims } from "../../types/index.js";
import { log } from "../logger/index.js";
import { AsymmetricAlgorithm } from "../../types/crypto.js";

export default async function validateJwt(
  hostname: string,
  token: string,
  publicKey: string,
  alg: AsymmetricAlgorithm
): Promise<JwtClaims | null> {
  const claims =  jsonwebtoken.verify(token, publicKey, {
    algorithms: [alg],
  });

  // We only support claims which are JSON objects.
  if (
    validateClaims(claims) &&
    checkExp(claims) &&
    checkNbf(claims) &&
    checkAud(claims, [hostname])
  ) {
    // Additional checks for exp, nbf and aud
    return claims;
  } else {
    return null;
  }
}
