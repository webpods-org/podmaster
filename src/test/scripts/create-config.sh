# If arg is not provided, take current directory.
CONFIG_DIR=${1:-$PWD}

# Get script directory
SCRIPT_PATH=$(dirname "$0")

# copy the source config file
cp "$SCRIPT_PATH/../../../dist/example-config/config.js" "$CONFIG_DIR/config-source.js"

# make a list of strings to replace
REPLACE_LIST=$(cat <<"EOF"
[
  [`"pods.example.com"`, `process.env.WEBPODS_TEST_HOSTNAME`], 
  
  [`"https://auth.example.com/"`, `"https://" + process.env.WEBPODS_TEST_HOSTNAME + "/"`],
  
  [`"/path/to/data/dir"`, `path.join(process.env.WEBPODS_TEST_CONFIG_DIR, "data")`],
  
  [`issuer: "https://issuer.example.com"`, `issuer: process.env.WEBPODS_TEST_JWT_ISSUER`], 
  
  [`secret: "mysecretkey"`, `publicKey: process.env.WEBPODS_TEST_JWT_PUBLIC_KEY`]
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
> "$CONFIG_DIR/config.js"