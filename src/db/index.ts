import * as pg from "pg";
import * as psychopiggy from "psychopiggy";
import * as pgConfig from "../config/pg";

export async function init() {
  let config: psychopiggy.IDbConfig = pgConfig.get();

  if (config) {
    psychopiggy.createPool(config);
  } else {
    throw "Cannot find database configuration.";
  }
}

export function getPool() {
  return psychopiggy.getPool(pgConfig.get());
}

export async function withTransaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>
) {
  return await psychopiggy.withTransaction(fn, pgConfig.get());
}
