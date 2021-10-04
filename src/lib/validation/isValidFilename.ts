export default function isValidFilename(name: string) {
  if (name.includes("..") || name.includes("/")) {
    return false;
  } else {
    return true;
  }
}
