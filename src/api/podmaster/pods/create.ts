import createPod from "../../../domain/pods/createPod.js";
import { handleResultWithJwt } from "../../handleResult.js";
import { IKoaAppContext } from "../../../types/koa.js";
import errors from "../../../errors/codes.js";
import { StatusCodes } from "http-status-codes";

export type CreatePodAPIResult = {
  hostname: string;
};

export default async function createAPI(ctx: IKoaAppContext): Promise<void> {
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
