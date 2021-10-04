import { ParameterizedContext, Next } from "koa";
import jsonwebtoken, { JwtPayload } from "jsonwebtoken";
import { log, logException } from "../logger/index.js";
import { IKoaAppContext } from "../../types/koa.js";
import getJwtValidationParams from "./getJwtValidationParams.js";
import { checkAud, checkExp, checkNbf } from "./validations.js";
import { InvalidResult, ValidResult } from "../../Result.js";
import { StatusCodes } from "http-status-codes";

export class AuthenticationError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super();
    this.message = message;
    this.code = code;
  }
}

export default function jwtMiddleware<
  TClaims,
  TKoaAppContext extends IKoaAppContext<TClaims>
>(
  options: { exclude: RegExp[] },
  validator: (claims: string | JwtPayload) => claims is TClaims
) {
  return async (ctx: TKoaAppContext, next: Next): Promise<void> => {
    if (options.exclude.some((regex) => regex.test(ctx.path))) {
      await next();
    } else {
      if (!(ctx as any).state) {
        ctx.state = { jwt: undefined };
      }

      try {
        const jwtParams = await getJwtParametersFromContext(ctx);

        if (jwtParams instanceof ValidResult) {
          const claims = await jsonwebtoken.verify(
            jwtParams.value.token,
            jwtParams.value.publicKey,
            {
              algorithms: [jwtParams.value.alg],
            }
          );

          // We only support claims which are JSON objects.
          if (validator(claims)) {
            const hostname = ctx.URL.hostname;
            // Additional checks for exp, nbf and aud
            if (
              checkExp(claims) &&
              checkNbf(claims) &&
              checkAud(claims, [hostname])
            ) {
              ctx.state.jwt = {
                claims,
              };
            }
          } else {
            log(
              "info",
              JSON.stringify({ error: "Claim was a string.", jwtParams })
            );
          }
        } else {
          log("info", JSON.stringify(jwtParams));
        }

        return await next();
      } catch (ex) {
        logException(ex);
      }
    }
  };
}

async function getJwtParametersFromContext(ctx: ParameterizedContext) {
  const token = resolveAuthorizationHeader(ctx);

  if (token === null) {
    return new InvalidResult({
      error: "Missing JWT.",
      status: StatusCodes.UNAUTHORIZED,
    });
  }

  return await getJwtValidationParams(token);
}

function resolveAuthorizationHeader(ctx: ParameterizedContext): string | null {
  if (!ctx.header || !ctx.header.authorization) {
    return null;
  }

  const parts = ctx.header.authorization.trim().split(" ");

  return parts.length === 2
    ? /^Bearer$/i.test(parts[0])
      ? parts[1]
      : null
    : null;
}
