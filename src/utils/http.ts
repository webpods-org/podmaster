export function getFieldValue(
  value: string | string[] | undefined
): string | undefined {
  return value !== undefined
    ? Array.isArray(value)
      ? value[0]
      : value
    : undefined;
}
