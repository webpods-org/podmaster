CONFIG_DIR=$1
PODMASTER_HOSTNAME=$2
PROVIDER_HOSTNAME=$3

# Get script directory
SCRIPT_PATH=$(dirname "$0")

# copy the source config file
cp "$SCRIPT_PATH/config.mjs" "$CONFIG_DIR/config-source.js"

# Replace all the newlines with \r\n
PROVIDER_PUBLIC_KEY=$(basho -i fs fs 'fs.readFileSync("'"$CONFIG_DIR"'/provider.RS256.key.pub.pem").toString().replace(/\r?\n|\r/g, "\\r\\n")')
PODMASTER_PRIVATE_KEY=$(basho -i fs fs 'fs.readFileSync("'"$CONFIG_DIR"'/podmaster.RS256.key").toString().replace(/\r?\n|\r/g, "\\r\\n")')
PODMASTER_PUBLIC_KEY=$(basho -i fs fs 'fs.readFileSync("'"$CONFIG_DIR"'/podmaster.RS256.key.pub.pem").toString().replace(/\r?\n|\r/g, "\\r\\n")')
SOME_OTHER_PODMASTER_PUBLIC_KEY=$(basho -i fs fs 'fs.readFileSync("'"$CONFIG_DIR"'/podzilla.RS256.key.pub.pem").toString().replace(/\r?\n|\r/g, "\\r\\n")')


# write out the new confile file.
basho \
--import fs fs \
--import path path \
-d filename "\"$CONFIG_DIR/config-source.js\"" \
-j "fs.readFileSync(k.filename).toString()" \
-j "x.replace(/pods\.podhost\.example\.com/g, \"$PODMASTER_HOSTNAME\")" \
-j "x.replace(/auth\.podhost\.example\.com/g, \"$PROVIDER_HOSTNAME\")" \
-j "x.replace(/\/path\/to\/data\/dir/g, \"$CONFIG_DIR\")" \
-j "x.replace(/provider-publickey/g, \"$PROVIDER_PUBLIC_KEY\")" \
-j "x.replace(/podmaster-privatekey/g, \"$PODMASTER_PRIVATE_KEY\")" \
-j "x.replace(/podmaster-publickey/g, \"$PODMASTER_PUBLIC_KEY\")" \
-j "x.replace(/podzilla-publickey/g, \"$SOME_OTHER_PODMASTER_PUBLIC_KEY\")" \
> "$CONFIG_DIR/config.mjs"

rm "$CONFIG_DIR/config-source.js"