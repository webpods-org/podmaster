export default function transformQuery<T = string>(
  param: string | string[] | undefined,
  then: (x: string) => T
): T | undefined {
  return param !== undefined
    ? then(Array.isArray(param) ? param[0] : param)
    : undefined;
}
