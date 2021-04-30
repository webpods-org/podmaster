import { JwtClaims } from "../../types/config";
import * as config from "../../config";
import {
  ACCESS_DENIED,
  CANNOT_CREATE_POD_IN_SELF_HOSTING_MODE,
} from "../errors/codes";

export default async function createPod(hostname: string, claims: JwtClaims) {
  const appConfig = config.get();
  if (appConfig.mode === "public") {
    for (const tier of appConfig.tiers) {
      for (const key in tier.claims) {
        // Verify the claims
        if (claims[key] !== tier.claims[key]) {
          return {
            success: false,
            error: "Access denied.",
            errorCode: ACCESS_DENIED,
          };
        }

        // Claims verified.
        // Let's create the POD.
        
      }
    }
  } else {
    return {
      success: false,
      error:
        "Cannot create a pod in self-hosted mode. Try adding it to configuration manually.",
      errorCode: CANNOT_CREATE_POD_IN_SELF_HOSTING_MODE,
    };
  }
}