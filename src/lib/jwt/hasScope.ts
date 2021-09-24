import { PodScope } from "../../types/types.js";

export default function hasScope(
  scope: string | undefined,
  app: string,
  requiredScope: PodScope
): boolean {
  return scope && scope.split(" ").includes(`${app}:${requiredScope}`)
    ? true
    : false;
}
