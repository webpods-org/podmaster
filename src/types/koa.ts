import { IRouterContext } from "koa-router";

export interface IKoaAppContext extends IRouterContext {
  state: {
    jwt:
      | {
          claims: {
            iss: string;
            sub: string;
            [key: string]: string;
          };
        }
      | undefined;
  };
}
