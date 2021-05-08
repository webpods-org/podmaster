import { AsymmetricAlgorithm, SymmetricAlgorithm } from "../../types/crypto";

const symmetricAlgorithms = ["HS256", "HS384", "HS512"];

const asymmetricAlgorithms = [
  "RS256",
  "RS384",
  "RS512",
  "PS256",
  "PS384",
  "PS512",
  "ES256",
  "ES384",
  "ES512",
];

export function isSymmetricAlgorithm(alg: string): alg is SymmetricAlgorithm {
  return symmetricAlgorithms.includes(alg);
}

export function isAsymmetricAlgorithm(
  alg: string
): alg is AsymmetricAlgorithm {
  return asymmetricAlgorithms.includes(alg);
}
