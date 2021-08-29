export default function getObjectWithProps(
  source: Record<string, any>,
  props: string[]
): Record<string, any> {
  return props.reduce((result, prop) => {
    return prop
      .split(".")
      .reduce((acc, unNestedProp) => acc[unNestedProp], result as any);
  }, {});
}
