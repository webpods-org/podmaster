CONFIG_DIR=$1
HOSTNAME=$2
JWT_ISSUER_HOSTNAME=$3

# Create keys
ssh-keygen -t rsa -b 4096 -m PEM -f "$CONFIG_DIR/jwtRS256.key" -q -N ""

# Convert it to a PEM file format.
ssh-keygen -f "$CONFIG_DIR/jwtRS256.key.pub" -e -m pem >"$CONFIG_DIR/jwtRS256.key.pub.pem"

basho \
  --import fs fs \
  --import crypto crypto \
  -d header '{ "alg": "RS256", "type": "JWT" }' \
  -d payload '{ "sub": "alice", "iss": "https://'$JWT_ISSUER_HOSTNAME'/", kid: "007", "aud": "'$HOSTNAME'", "exp": Math.floor(Date.now()/1000)  + 3600, "iat": Math.floor(Date.now()/1000) }' \
  -d toBase64 'x => Buffer.from(JSON.stringify(x)).toString("base64")' \
  -d toBase64Url 'x => x.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")' \
  -d base64Header 'k.toBase64Url(k.toBase64(k.header))' \
  -d base64Payload 'k.toBase64Url(k.toBase64(k.payload))' \
  -d privateKey 'fs.readFileSync("'"$CONFIG_DIR"'/jwtRS256.key", "utf8")' \
  -d signFunc 'crypto.createSign("RSA-SHA256")' \
  -d sig \
  'k.signFunc.update(`${k.base64Header}.${k.base64Payload}`),k.signFunc.end(),k.toBase64Url(k.signFunc.sign(k.privateKey, "base64"))' \
  -d jwt '`${k.base64Header}.${k.base64Payload}.${k.sig}`' \
  -j k.jwt \
  >"$CONFIG_DIR/alice_podmaster_jwt"

basho \
  --import fs fs \
  --import crypto crypto \
  -d header '{ "alg": "RS256", "type": "JWT" }' \
  -d payload '{ "sub": "alice", "iss": "https://'$JWT_ISSUER_HOSTNAME'/", kid: "007", "aud": "myweblog.'$HOSTNAME'", "exp": Math.floor(Date.now()/1000)  + 3600, "iat": Math.floor(Date.now()/1000) }' \
  -d toBase64 'x => Buffer.from(JSON.stringify(x)).toString("base64")' \
  -d toBase64Url 'x => x.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")' \
  -d base64Header 'k.toBase64Url(k.toBase64(k.header))' \
  -d base64Payload 'k.toBase64Url(k.toBase64(k.payload))' \
  -d privateKey 'fs.readFileSync("'"$CONFIG_DIR"'/jwtRS256.key", "utf8")' \
  -d signFunc 'crypto.createSign("RSA-SHA256")' \
  -d sig \
  'k.signFunc.update(`${k.base64Header}.${k.base64Payload}`),k.signFunc.end(),k.toBase64Url(k.signFunc.sign(k.privateKey, "base64"))' \
  -d jwt '`${k.base64Header}.${k.base64Payload}.${k.sig}`' \
  -j k.jwt \
  >"$CONFIG_DIR/alice_pod_jwt"

basho \
  --import fs fs \
  --import crypto crypto \
  -d header '{ "alg": "RS256", "type": "JWT" }' \
  -d payload '{ "sub": "carol", "iss": "https://'$JWT_ISSUER_HOSTNAME'/", kid: "007", "aud": "myweblog.'$HOSTNAME'", "exp": Math.floor(Date.now()/1000)  + 3600, "iat": Math.floor(Date.now()/1000) }' \
  -d toBase64 'x => Buffer.from(JSON.stringify(x)).toString("base64")' \
  -d toBase64Url 'x => x.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")' \
  -d base64Header 'k.toBase64Url(k.toBase64(k.header))' \
  -d base64Payload 'k.toBase64Url(k.toBase64(k.payload))' \
  -d privateKey 'fs.readFileSync("'"$CONFIG_DIR"'/jwtRS256.key", "utf8")' \
  -d signFunc 'crypto.createSign("RSA-SHA256")' \
  -d sig \
  'k.signFunc.update(`${k.base64Header}.${k.base64Payload}`),k.signFunc.end(),k.toBase64Url(k.signFunc.sign(k.privateKey, "base64"))' \
  -d jwt '`${k.base64Header}.${k.base64Payload}.${k.sig}`' \
  -j k.jwt \
  >"$CONFIG_DIR/carol_pod_jwt"
