import { AppConfig } from "../types/config";

let config: AppConfig;

export function init(c: AppConfig) {
  config = c;
}

export function get(): AppConfig {
  return config;
}
