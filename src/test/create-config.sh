if [[ $# -eq 0 ]] ; then
    echo 'Pass config dir as param'
    exit 1
fi

cp dist/example-config/config.js "$1/config-source.js"

bashocmd=$(cat <<"EOF"
[
  [`"pods.example.com"`, `process.env.WEBPODS_TEST_HOSTNAME as string`], [`"https://auth.example.com/"`, `"https://" + (process.env.WEBPODS_TEST_HOSTNAME as string) + "/"`],
  [`"/path/to/data/dir"`, `process.env.WEBPODS_TEST_DATA_DIR as string`]
]
EOF
)

# replace new lines.
bashocmd=${bashocmd//$'\n'/}

basho \
--import fs fs \
-d filename "\"$1/config-source.js\"" \
-d replacements "$bashocmd" \
-d filecontents 'fs.readFileSync(k.filename).toString()' \
-j k.replacements \
-r 'acc.replace(new RegExp(x[0], "g"), x[1])' k.filecontents \
> "$1/config.js"
#basho -d replacements "$bashocmd" k.replacements
