CONFIG_DIR=$1
HOSTNAME=$2
JWT_ISSUER_HOSTNAME=$3

# Get script directory
SCRIPT_PATH=$(dirname "$0")

# copy the source config file
cp "$SCRIPT_PATH/config.mjs" "$CONFIG_DIR/config-source.js"

# Replace all the newlines with \r\n
PUBLIC_KEY=$(basho -i fs fs 'fs.readFileSync("'"$CONFIG_DIR"'/jwtRS256.key.pub.pem").toString().replace(/\r?\n|\r/g, "\\r\\n")')

# write out the new confile file.
basho \
--import fs fs \
--import path path \
-d filename "\"$CONFIG_DIR/config-source.js\"" \
-j "fs.readFileSync(k.filename).toString()" \
-j "x.replace(/pods\.example\.com/g, \"$HOSTNAME\")" \
-j "x.replace(/auth\.example\.com/g, \"$JWT_ISSUER_HOSTNAME\")" \
-j "x.replace(/\/path\/to\/data\/dir/g, \"$CONFIG_DIR\")" \
-j "x.replace(/issuer\.example\.com/g, \"$JWT_ISSUER_HOSTNAME\")" \
-j "x.replace(/issuerpubkey/g, \"$PUBLIC_KEY\")" \
> "$CONFIG_DIR/config.mjs"

rm "$CONFIG_DIR/config-source.js"