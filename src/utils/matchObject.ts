export default function matchObject(subset: any, superset: any) : boolean {
  if (typeof subset !== typeof superset) {
    return false;
  }
  if (Array.isArray(subset)) {
    if (!Array.isArray(superset)) {
      return false;
    } else {
      for (const item of subset) {
        if (!superset.some((bItem) => matchObject(item, bItem))) {
          return false;
        }
      }
    }
  } else if (Object(subset) === subset) {
    if (Object(superset) !== superset) {
      return false;
    } else {
      for (const valueKey of Object.keys(subset)) {
        if (!matchObject(subset[valueKey], superset[valueKey])) {
          return false;
        }
      }
    }
  } else {
    if (subset !== superset) {
      return false;
    }
  }
  return true;
}
