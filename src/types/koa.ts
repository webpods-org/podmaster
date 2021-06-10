import { IRouterContext } from "koa-router";

export type JwtIdentityClaims = {
  iss: string;
  sub: string;
};

export interface IKoaAppContext extends IRouterContext {
  state: {
    jwt:
      | {
          claims: JwtIdentityClaims;
        }
      | undefined;
  };
}
