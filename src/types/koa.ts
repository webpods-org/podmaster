import { IRouterContext } from "koa-router";
import { JwtClaims } from "./types.js";

export interface IKoaAppContext extends IRouterContext {
  state: {
    jwt:
      | {
          claims: JwtClaims;
        }
      | undefined;
  };
}
