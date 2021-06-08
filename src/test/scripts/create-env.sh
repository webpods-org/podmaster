CONFIG_DIR=$1
HOSTNAME=$2
JWT_ISSUER_HOSTNAME=$3
NOTIFIER_HOSTNAME=$4

# Get script directory
SCRIPT_PATH=$(dirname "$0")

# copy environment setup
cp "$SCRIPT_PATH/env.sh" "$CONFIG_DIR/env-source.sh"

# Replace all the newlines with \r\n
PUBLIC_KEY=$(basho -i fs fs 'fs.readFileSync("'"$CONFIG_DIR"'/jwtRS256.key.pub.pem").toString().replace(/\r?\n|\r/g, "\\r\\n")')

# make a list of strings to replace
REPLACE_LIST=$(cat <<"EOF"
[
  [`WEBPODS_TEST_CONFIG_DIR="/some/path"`, `WEBPODS_TEST_CONFIG_DIR="${k.configDir}"`], 
  
  [`WEBPODS_TEST_HOSTNAME="pod.example.com"`, `WEBPODS_TEST_HOSTNAME="${k.hostname}"`],

  [`WEBPODS_TEST_NOTIFIER_HOSTNAME="notifier.example.com"`, `WEBPODS_TEST_NOTIFIER_HOSTNAME="${k.notifierHostname}"`],
  
  [`WEBPODS_TEST_JWT_ISSUER_HOSTNAME="issuer.example.com"`, `WEBPODS_TEST_JWT_ISSUER_HOSTNAME="${k.jwtIssuer}"`],
  
  [`WEBPODS_TEST_JWT_PUBLIC_KEY="abcdef"`, `WEBPODS_TEST_JWT_PUBLIC_KEY="${k.publicKey}"`], 
]
EOF
)

# replace new lines.
REPLACE_LIST=${REPLACE_LIST//$'\n'/}

# write out the new confile file.
basho \
-i fs fs \
-i path path \
-d configDir "\"$CONFIG_DIR\"" \
-d hostname "\"$HOSTNAME\"" \
-d notifierHostname "\"$NOTIFIER_HOSTNAME\"" \
-d jwtIssuer "\"$JWT_ISSUER_HOSTNAME\"" \
-d publicKey "\"$PUBLIC_KEY\"" \
-d filename "\"$CONFIG_DIR/env-source.sh\"" \
-d replacements "$REPLACE_LIST" \
-d filecontents 'fs.readFileSync(k.filename).toString()' \
-j k.replacements \
-r 'acc.replace(new RegExp(x[0], "g"), x[1])' k.filecontents \
> "$CONFIG_DIR/env.sh"