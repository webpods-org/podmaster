export default function getQueryParameter(
  param: string | string[] | undefined
): string | undefined {
  return Array.isArray(param) ? param[0] : param;
}
