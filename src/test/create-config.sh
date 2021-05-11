if [[ $# -eq 0 ]] ; then
    echo 'Pass config dir as param. eg: '
    exit 1
fi

if [ ! -d "$1" ]; then
  mkdir -p $1
fi

# replace trailing slash.
CONFIG_DIR=${1%/}

# Get script directory
SCRIPT_PATH=$(dirname "$0")

# copy the source config file
cp dist/example-config/config.js "$CONFIG_DIR/config-source.js"

# make a list of strings to replace
REPLACE_LIST=$(cat <<"EOF"
[
  [`"pods.example.com"`, `process.env.WEBPODS_TEST_HOSTNAME as string`], [`"https://auth.example.com/"`, `"https://" + (process.env.WEBPODS_TEST_HOSTNAME as string) + "/"`],
  [`"/path/to/data/dir"`, `process.env.WEBPODS_TEST_DATA_DIR as string`]
]
EOF
)

# replace new lines.
REPLACE_LIST=${REPLACE_LIST//$'\n'/}

# write out the new confile file.
basho \
--import fs fs \
-d filename "\"$CONFIG_DIR/config-source.js\"" \
-d replacements "$REPLACE_LIST" \
-d filecontents 'fs.readFileSync(k.filename).toString()' \
-j k.replacements \
-r 'acc.replace(new RegExp(x[0], "g"), x[1])' k.filecontents \
> "$CONFIG_DIR/config.js"

# JWT
# 1. let's create keys
ssh-keygen -t rsa -b 4096 -m PEM -f "$CONFIG_DIR/jwtRS256.key" -q -N ""
# 2. convert it to a PEM file format.
ssh-keygen -f "$CONFIG_DIR/jwtRS256.key.pub" -e -m pem > "$CONFIG_DIR/jwtRS256.key.pub.pem"
# 3. create the jwt
"$SCRIPT_PATH/create-jwt.sh" $CONFIG_DIR

