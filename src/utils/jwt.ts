import jwt = require("jsonwebtoken");
import { AppConfig, JwtClaims } from "../types/config";

let config: IJwtConfig;

export function init(c: AppConfig) {
  if (!config) {
    config = c;
  } else {
    throw "JWT config has already been initialized.";
  }
}

export function getConfig(): IJwtConfig {
  return config;
}

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
    const result = jwt.verify(token, config.publicKey);
    return {
      valid: true,
      claims: (result as any).claims,
    };
  } catch {
    return { valid: false };
  }
}