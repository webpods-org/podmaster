import { IKoaPodAppContext } from "../../types/koa.js";
import getPodInfo from "../../domain/pods/getInfo.js";
import { handleResultWithJwt } from "../handleResult.js";
import { Identity } from "../../types/index.js";

export type GetPodInfoAPIResult = {
  id: string;
  name: string;
  app: string;
  hostname: string;
  createdBy: Identity;
  createdAt: number;
  tier: string;
  description: string;
};

export default async function getPodAPI(ctx: IKoaPodAppContext): Promise<void> {
  const hostname = ctx.URL.hostname;

  await handleResultWithJwt(
    ctx,
    (ctx) => getPodInfo(hostname, ctx.state.jwt.claims),
    (result) => {
      const pod = result.value;
      const body: GetPodInfoAPIResult = {
        id: pod.id,
        name: pod.name,
        app: pod.app,
        hostname: pod.hostname,
        createdBy: pod.createdBy,
        createdAt: pod.createdAt,
        tier: pod.tier,
        description: pod.description,
      };

      ctx.body = body;
    }
  );
}
