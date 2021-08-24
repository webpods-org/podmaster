#!/usr/bin/env node
import * as path from "path";
import * as fs from "fs";
import * as yargs from "yargs";
import startApp from "./startApp.js";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const argv = yargs(process.argv.slice(2))
  .options({
    c: { type: "string", alias: "config" },
    p: { type: "number", default: 8080, alias: "port" },
    v: { type: "boolean", alias: "version" },
  })
  .parseSync();

// Print the version and exit
if (argv.v) {
  const pkg = path.join(__dirname, "../package.json");
  const packageJSON = JSON.parse(fs.readFileSync(pkg, "utf8"));
  console.log(packageJSON.version);
} else {
  if (!argv.p) {
    console.log("The port should be specified with the -p option.");
    process.exit(1);
  }

  if (!argv.c) {
    console.log(
      "The configuration file should be specified with the -c option."
    );
    process.exit(1);
  }

  const configFile = argv.c;
  const port = argv.p;

  startApp(configFile).then((server) => {
    server.listen(port);
    console.log(`listening on port ${port}`);
  });
}
