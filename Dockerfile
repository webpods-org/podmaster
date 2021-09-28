FROM node:16

# Create app directory
WORKDIR /apps/podmaster

# Bundle app source
COPY . .

EXPOSE 8080

cmd ["sh", "-c", "node dist/index.js -p 8080 -c /data/podmaster/config.mjs"]
