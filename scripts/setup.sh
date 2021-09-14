if [[ ! $# -eq 3 ]] ; then
    echo 'Usage is ./setup-test $CONFIG_DIR $HOSTNAME $JWT_ISSUER_HOSTNAME'
    exit 1
fi

if [ ! -d "$1" ]; then
  mkdir -p $1
  mkdir -p "$1/logs"
  mkdir -p "$1/pods"
fi

# replace trailing slash.
CONFIG_DIR=${1%/}
HOSTNAME=$2
PROVIDER_HOSTNAME=$3

# Get script directory
SCRIPT_PATH=$(dirname "$0")

# JWT
"$SCRIPT_PATH/create-jwt.sh" $CONFIG_DIR $HOSTNAME $PROVIDER_HOSTNAME

# Create the config file.
"$SCRIPT_PATH/create-config.sh" $CONFIG_DIR $HOSTNAME $PROVIDER_HOSTNAME

# Create the env variables file.
"$SCRIPT_PATH/create-env.sh" $CONFIG_DIR
