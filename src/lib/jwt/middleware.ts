import { INVALID_JWT } from "../../errors/codes";
import * as jsonwebtoken from "jsonwebtoken";
import { ParameterizedContext, Next } from "koa";
import { Result } from "../../types/api";
import { log, logException } from "../logger/log";
import { IKoaAppContext } from "../../types/koa";
import { JwtClaims } from "../../types/types";
import getJwtParams, { JwtParamsForAsymmetricAlgorithm } from "./getJwtParams";

export class AuthenticationError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super();
    this.message = message;
    this.code = code;
  }
}

export default function jwtMiddleware(options: { exclude: RegExp[] }) {
  return async (ctx: IKoaAppContext, next: Next): Promise<void> => {
    if (options.exclude.some((regex) => regex.test(ctx.path))) {
      next();
    } else {
      if (!(ctx as any).state) {
        ctx.state = { jwt: undefined };
      }

      try {
        const jwtParams = await getJwtParametersFromContext(ctx);

        if (jwtParams.ok) {
          const claims = jsonwebtoken.verify(
            jwtParams.value.token,
            jwtParams.value.publicKey,
            {
              algorithms: [jwtParams.value.alg],
            }
          );

          // We only support claims which are JSON objects.
          if (areClaimsValid(claims)) {
            ctx.state.jwt = {
              claims,
            };
          } else {
            log(
              "info",
              JSON.stringify({ error: "Claim was a string.", jwtParams })
            );
          }
        } else {
          log("info", JSON.stringify(jwtParams));
        }

        return next();
      } catch (ex) {
        logException(ex);
      }
    }
  };
}

function areClaimsValid(claims: object | string): claims is JwtClaims {
  return (
    typeof claims === "object" && (claims as any).iss && (claims as any).sub
  );
}

async function getJwtParametersFromContext(
  ctx: ParameterizedContext
): Promise<Result<JwtParamsForAsymmetricAlgorithm>> {
  const token = resolveAuthorizationHeader(ctx);

  if (token === null) {
    return {
      ok: false,
      error: "Authentication error. Missing JWT.",
      code: INVALID_JWT,
    };
  }

  return getJwtParams(token);
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
