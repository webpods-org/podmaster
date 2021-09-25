import { PodScope } from "../../types/index.js";

export default function hasScope(
  scope: string | undefined,
  app: string,
  requiredScope: PodScope
): boolean {
  return scope && scope.split(" ").includes(`${app}:${requiredScope}`)
    ? true
    : false;
}
