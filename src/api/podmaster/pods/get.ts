import { getPods } from "../../../domain/pods/getPods.js";
import { handleResultWithJwt } from "../../handleResult.js";
import { IKoaAppContext } from "../../../types/koa.js";

export type GetPodsAPIResult = {
  pods: {
    hostname: string;
    name: string;
    description: string;
  }[];
};

export default async function getAPI(ctx: IKoaAppContext): Promise<void> {
  await handleResultWithJwt(
    ctx,
    (ctx) =>
       getPods(ctx.state.jwt.claims),
    (result) => {
      const body: GetPodsAPIResult = {
        pods: result.value.pods.map((x) => ({
          hostname: x.hostname,
          name: x.name,
          description: x.description,
        })),
      };
      ctx.body = body;
    }
  );
}
