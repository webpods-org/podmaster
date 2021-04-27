import { IJwtConfig } from "../types";

let config: IJwtConfig;

export function init(c: IJwtConfig) {
  config = c;
}

export function get(): IJwtConfig {
  return config;
}
