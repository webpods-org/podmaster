CONFIG_DIR=$1

# Get script directory
SCRIPT_PATH=$(dirname "$0")

# copy the source config file
cp "$SCRIPT_PATH/../../../dist/example-config/config.js" "$CONFIG_DIR/config-source.js"

# make a list of strings to replace
REPLACE_LIST=$(cat <<"EOF"
[
  [`"pods.example.com"`, `process.env.PODMASTER_TEST_HOSTNAME`],

  [`"https://auth.example.com/"`, `"https://" + process.env.PODMASTER_TEST_JWT_ISSUER_HOSTNAME + "/"`],
  
  [`"/path/to/data/dir"`, `path.join(process.env.PODMASTER_TEST_DATA_DIR)`],
  
  [`iss: "https://issuer.example.com"`, `iss: "https://" + process.env.PODMASTER_TEST_JWT_ISSUER_HOSTNAME + "/"`], 
  
  [`publicKey: "mysecretkey"`, `publicKey: process.env.PODMASTER_TEST_JWT_PUBLIC_KEY`]
]
EOF
)

# replace new lines.
REPLACE_LIST=${REPLACE_LIST//$'\n'/}

# write out the new confile file.
basho \
--import fs fs \
--import path path \
-d filename "\"$CONFIG_DIR/config-source.js\"" \
-d replacements "$REPLACE_LIST" \
-d filecontents 'fs.readFileSync(k.filename).toString()' \
-j k.replacements \
-r 'acc.replace(new RegExp(x[0], "g"), x[1])' k.filecontents \
> "$CONFIG_DIR/config.mjs"