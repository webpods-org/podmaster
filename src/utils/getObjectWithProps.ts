export default function getObjectWithProps(source: any, props: string[]): any {
  return props.reduce((result, prop) => {
    return prop
      .split(".")
      .reduce((acc, unNestedProp) => acc[unNestedProp], result as any);
  }, {});
}
