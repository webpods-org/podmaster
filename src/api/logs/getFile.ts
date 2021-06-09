import * as config from "../../config";
import { IRouterContext } from "koa-router";
import handleResult from "../handleResult";
import { IKoaAppContext } from "../../types/koa";

export default async function getLogsAPI(ctx: IKoaAppContext) {
  console.log("hello world...");
  ctx.body = "hello yeah!";
}
