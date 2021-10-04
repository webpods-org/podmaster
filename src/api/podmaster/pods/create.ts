import createPod from "../../../domain/pods/createPod.js";
import { handleResultWithJwt } from "../../handleResult.js";
import { IKoaPodmasterAppContext } from "../../../types/koa.js";

export type CreatePodAPIResult = {
  hostname: string;
};

export default async function createAPI(
  ctx: IKoaPodmasterAppContext
): Promise<void> {
  await handleResultWithJwt(
    ctx,
    (ctx) =>
      createPod(
        ctx.request.body.id,
        ctx.request.body.name,
        ctx.request.body.app,
        ctx.request.body.description || "",
        ctx.state.jwt.claims
      ),
    (result) => {
      const body: CreatePodAPIResult = {
        hostname: result.value.hostname,
      };
      ctx.body = body;
    }
  );
}
