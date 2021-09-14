export const symmetricAlgorithms = ["HS256", "HS384", "HS512"];

export const asymmetricAlgorithms = [
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

export function getKeyType(alg: string) {
  return ["RS256", "RS384", "RS512"].includes(alg)
    ? "RSA"
    : ["PS256", "PS384", "PS512", "ES256", "ES384", "ES512"].includes(alg)
    ? "EC"
    : "UNKNOWN";
}
