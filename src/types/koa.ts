import { IRouterContext } from "koa-router";
import { PodJwtClaims, PodmasterJwtClaims } from "./index.js";

export interface IKoaAppContext<TClaims> extends IRouterContext {
  state: {
    jwt:
      | {
          claims: TClaims;
        }
      | undefined;
  };
}

export interface IKoaPodAppContext extends IKoaAppContext<PodJwtClaims> {}
export interface IKoaPodmasterAppContext
  extends IKoaAppContext<PodmasterJwtClaims> {}
