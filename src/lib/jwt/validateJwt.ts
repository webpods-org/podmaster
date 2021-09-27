import validateClaims from "./validateClaims.js";
import { checkAud, checkExp, checkNbf } from "./validations.js";
import jsonwebtoken from "jsonwebtoken";
import { JwtClaims } from "../../types/index.js";
import { AsymmetricAlgorithm } from "../../types/crypto.js";
import { InvalidResult, ValidResult } from "../../Result.js";

export default async function validateJwt(
  hostname: string,
  token: string,
  publicKey: string,
  alg: AsymmetricAlgorithm
): Promise<ValidResult<JwtClaims> | InvalidResult<"INVALID_CLAIMS">> {
  const claims = jsonwebtoken.verify(token, publicKey, {
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
    return new ValidResult(claims);
  } else {
    return new InvalidResult("INVALID_CLAIMS");
  }
}
