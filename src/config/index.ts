import { AppConfig } from "../types/types";

let config: AppConfig;

export function init(c: AppConfig) {
  config = c;
}

export function get(): AppConfig {
  return config;
}
