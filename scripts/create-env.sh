CONFIG_DIR=$1

# Get script directory
SCRIPT_PATH=$(dirname "$0")

# copy environment setup
cp "$SCRIPT_PATH/env.sh" "$CONFIG_DIR/env-source.sh"

# write out the new confile file.
basho \
-i fs fs \
-j "fs.readFileSync(\"$CONFIG_DIR/env-source.sh\").toString()" \
-j "x.replace(/\/path\/to\/data\/dir/g, \"$CONFIG_DIR\")" \
> "$CONFIG_DIR/env.sh"

rm "$CONFIG_DIR/env-source.sh"