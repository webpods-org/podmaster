import jwt = require("jsonwebtoken");
import { AppConfig, JwtClaims } from "../types/config";

export type IJwt = {
  [key: string]: string;
};

export type IVerifiedInvalidJwt = {
  valid: false;
};

export type IVerifiedValidJwt = {
  valid: true;
  claims: JwtClaims;
};

export type IVerifiedJwt = IVerifiedInvalidJwt | IVerifiedValidJwt;

export function verify(token: string): IVerifiedJwt {
  try {
    // const result = jwt.verify(token, config.publicKey);
    return {
      valid: true,
      claims: ({} as any).claims,
    };
  } catch {
    return { valid: false };
  }
}