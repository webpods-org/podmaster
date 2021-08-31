export default function verifyAudClaim(
  aud: string | string[],
  hostname: string
) {
  return aud === hostname || (Array.isArray(aud) && aud.includes(hostname));
}
