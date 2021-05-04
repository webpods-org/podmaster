import { IRouterContext } from "koa-router";
import { validateJwt } from "../lib/authUtils";
import createPod from "../../domain/pod/createPod";
import * as config from "../../config";

export default async function getProfile(ctx: IRouterContext) {}
