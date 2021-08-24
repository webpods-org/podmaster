if [[ ! $# -eq 3 ]] ; then
    echo 'Usage is ./setup-test $CONFIG_DIR $HOSTNAME $JWT_ISSUER_HOSTNAME'
    exit 1
fi

if [ ! -d "$1" ]; then
  mkdir -p $1
  mkdir -p "$1/data"
  mkdir -p "$1/logs"
fi

# replace trailing slash.
CONFIG_DIR=${1%/}

HOSTNAME=$2
JWT_ISSUER_HOSTNAME=$3

# Get script directory
SCRIPT_PATH=$(dirname "$0")

# JWT
# 1. let's create keys
ssh-keygen -t rsa -b 4096 -m PEM -f "$CONFIG_DIR/jwtRS256.key" -q -N ""
# 2. convert it to a PEM file format.
ssh-keygen -f "$CONFIG_DIR/jwtRS256.key.pub" -e -m pem > "$CONFIG_DIR/jwtRS256.key.pub.pem"
# 3. create the jwt
"$SCRIPT_PATH/create-jwt.sh" $CONFIG_DIR $HOSTNAME $JWT_ISSUER_HOSTNAME > "$CONFIG_DIR/jwt"

# Create the config file.
"$SCRIPT_PATH/create-config.sh" $CONFIG_DIR 

# Create the env variables file.
"$SCRIPT_PATH/create-env.sh" $CONFIG_DIR $HOSTNAME $JWT_ISSUER_HOSTNAME
