import { IDbConfig } from "psychopiggy";

let config: IDbConfig;

export function init(c: IDbConfig) {
  config = c;
}

export function get(): IDbConfig {
  return config;
}
