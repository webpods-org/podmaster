CONFIG_DIR=$1
PODMASTER_HOSTNAME=$2
PROVIDER_HOSTNAME=$3

# Create keys, convert it to a PEM file format.
ssh-keygen -t rsa -b 4096 -m PEM -f "$CONFIG_DIR/provider.RS256.key" -q -N ""
ssh-keygen -f "$CONFIG_DIR/provider.RS256.key.pub" -e -m pkcs8 >"$CONFIG_DIR/provider.RS256.key.pub.pem"

ssh-keygen -t rsa -b 4096 -m PEM -f "$CONFIG_DIR/podmaster.RS256.key" -q -N ""
ssh-keygen -f "$CONFIG_DIR/podmaster.RS256.key.pub" -e -m pkcs8 >"$CONFIG_DIR/podmaster.RS256.key.pub.pem"

ssh-keygen -t rsa -b 4096 -m PEM -f "$CONFIG_DIR/podzilla.RS256.key" -q -N ""
ssh-keygen -f "$CONFIG_DIR/podzilla.RS256.key.pub" -e -m pkcs8 >"$CONFIG_DIR/podzilla.RS256.key.pub.pem"

function create_jwt() {
  local P_SUB=$1
  local P_KID=$2
  local P_AUD=$3
  local P_ISS_HOSTNAME=$4
  local P_PRIVATE_KEY_FILE=$5
  local P_FILENAME=$6

  basho \
    --import fs fs \
    --import crypto crypto \
    -d header '{ "alg": "RS256", "type": "JWT" }' \
    -d payload '{ "sub": "'$P_SUB'", "iss": "https://'$P_ISS_HOSTNAME'/", kid: "'$P_KID'", "aud": "'$P_AUD'", "exp": Math.floor(Date.now()/1000)  + 3600, "iat": Math.floor(Date.now()/1000) }' \
    -d toBase64 'x => Buffer.from(JSON.stringify(x)).toString("base64")' \
    -d toBase64Url 'x => x.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")' \
    -d base64Header 'k.toBase64Url(k.toBase64(k.header))' \
    -d base64Payload 'k.toBase64Url(k.toBase64(k.payload))' \
    -d privateKey 'fs.readFileSync("'"$CONFIG_DIR/$P_PRIVATE_KEY_FILE"'", "utf8")' \
    -d signFunc 'crypto.createSign("RSA-SHA256")' \
    -d sig \
    'k.signFunc.update(`${k.base64Header}.${k.base64Payload}`),k.signFunc.end(),k.toBase64Url(k.signFunc.sign(k.privateKey, "base64"))' \
    -d jwt '`${k.base64Header}.${k.base64Payload}.${k.sig}`' \
    -j k.jwt \
    >"$CONFIG_DIR/$P_FILENAME"
}

create_jwt \
  alice \
  kid_provider \
  $PODMASTER_HOSTNAME \
  $PROVIDER_HOSTNAME \
  "provider.RS256.key" \
  alice_provider_jwt

create_jwt \
  alice \
  kid_podmaster \
  "myweblog.$PODMASTER_HOSTNAME" \
  $PODMASTER_HOSTNAME \
  "podmaster.RS256.key" \
  alice_pod_jwt

create_jwt \
  carol \
  kid_some_other_podmaster \
  "myweblog.$PODMASTER_HOSTNAME" \
  "podzilla.example.com" \
  "podzilla.RS256.key" \
  carol_pod_jwt

ssh-to-jwk ~/temp/webpods/podmaster.RS256.key.pub |
  basho --json '{ ...x, "alg": "RS256", kid: "k1_" + Date.now() }' \
    >"$CONFIG_DIR/podmaster.jwk.json"

ssh-to-jwk ~/temp/webpods/podzilla.RS256.key.pub |
  basho --json '{ ...x, "alg": "RS256", kid: "k1_" + Date.now() }' \
    >"$CONFIG_DIR/podzilla.jwk.json"
