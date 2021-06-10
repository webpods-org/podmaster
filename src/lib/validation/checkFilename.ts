export default function isFilenameValid(name: string) {
  if (name.includes("..") || name.includes("/")) {
    return false;
  } else {
    return true;
  }
}
