basho \
--import fs fs \
--import crypto crypto \
-d header '{ "alg": "RS256", "type": "JWT" }' \
-d payload '{ "sub": "alice", "iss": "example.com", "iat": Date.now() }' \
-d toBase64 'x => Buffer.from(JSON.stringify(x)).toString("base64")' \
-d toBase64Url 'x => x.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")' \
-d base64Header 'k.toBase64Url(k.toBase64(k.header))' \
-d base64Payload 'k.toBase64Url(k.toBase64(k.payload))' \
-d privateKey 'fs.readFileSync(process.cwd() + "/privatekey.pem", "utf8")' \
-d signFunc 'crypto.createSign("RSA-SHA256")' \
-d sig \
'k.signFunc.update(`${k.base64Header}.${k.base64Payload}`),k.signFunc.end(),k.toBase64Url(k.signFunc.sign(k.privateKey, "base64"))' \
-d jwt '`${k.base64Header}.${k.base64Payload}.${k.sig}`' \
k.jwt
