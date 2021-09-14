import { JwtClaims } from "../../../types/types.js";
import * as config from "../../../config/index.js";
import { ACCESS_DENIED, MISSING_FIELD } from "../../../errors/codes.js";
import matchObject from "../../../utils/matchObject.js";
import { Result } from "../../../types/api.js";
import jsonwebtoken, { SignOptions } from "jsonwebtoken";

export type CreateAuthTokenResult = { jwt: string };

export default async function createAuthToken(
  aud: string,
  userClaims: JwtClaims
): Promise<Result<CreateAuthTokenResult>> {
  if (aud) {
    const appConfig = config.get();

    const authenticator = appConfig.authenticators.find((authenticator) =>
      matchObject(
        { aud: appConfig.hostname, ...authenticator.claims },
        userClaims
      )
    );

    if (authenticator) {
      const issuer = `https://${appConfig.hostname}/`;
      const expiresIn = appConfig.auth.expiry;
      const keyid = config.getPodmasterJWK().kid;
      const subject = `${authenticator.name}/${userClaims.sub}`;
      const signOptions: SignOptions = {
        audience: aud,
        algorithm: "RS256",
        expiresIn,
        issuer,
        keyid,
        subject,
      };
      const jwt = jsonwebtoken.sign(
        {},
        appConfig.auth.keys.privateKey,
        signOptions
      );

      return { ok: true, value: { jwt } };
    } else {
      return {
        ok: false,
        code: ACCESS_DENIED,
        error: "Access denied.",
      };
    }
  } else {
    return {
      ok: false,
      code: MISSING_FIELD,
      error: "The aud field is required.",
    };
  }
}
