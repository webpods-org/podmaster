export function isAlphanumeric(text: string) {
  return text && /^[a-zA-Z][a-zA-Z0-9-]+$/.test(text);
}
