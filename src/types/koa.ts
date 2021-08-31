import { IRouterContext } from "koa-router";
import { JwtClaims } from "./types.js";

export type JwtIdentityClaims = {
  iss: string;
  sub: string;
  aud: string | string[];
};

export interface IKoaAppContext extends IRouterContext {
  state: {
    jwt:
      | {
          claims: JwtClaims;
        }
      | undefined;
  };
}
