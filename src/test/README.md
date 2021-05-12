# Testing WebPods

1. Create the configuration in a directory by running ./setup-test $CONFIG_DIR $HOSTNAME $JWT_ISSUER_HOSTNAME

2. Point CONFIG_DIR and JWT_ISSUER_HOSTNAME to localhost in /etc/hosts.

3. source $CONFIG_DIR/env.sh

Then run `npm run build && npm test`.

