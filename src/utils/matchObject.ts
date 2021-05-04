export default function matchObject(obj: any, source: any) : boolean {
  if (typeof source !== typeof obj) {
    return false;
  }
  if (Array.isArray(source)) {
    if (!Array.isArray(obj)) {
      return false;
    } else {
      for (const item of source) {
        if (!obj.some((bItem) => matchObject(item, bItem))) {
          return false;
        }
      }
    }
  } else if (Object(source) === source) {
    if (Object(obj) !== obj) {
      return false;
    } else {
      for (const valueKey of Object.keys(source)) {
        if (!matchObject(source[valueKey], obj[valueKey])) {
          return false;
        }
      }
    }
  } else {
    if (source !== obj) {
      return false;
    }
  }
  return true;
}
