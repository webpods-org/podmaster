import { AppConfig } from "../types/types.js";

let config: AppConfig;

export function init(c: AppConfig): void {
  config = c;
}

export function get(): AppConfig {
  return config;
}
