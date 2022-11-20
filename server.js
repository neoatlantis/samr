const { program } = require("commander");
const SAMRServer = require("./server/SAMRServer");
const fs = require("fs");
const _ = require("lodash");


program
    .name("SAMRServer")
    .description("Start a SAMR server by command line.")
    .version(JSON.parse(fs.readFileSync("./package.json")).version)
;

program.argument(
    "<authority_keys>",
    "File to authority keys (multiple keys in single export)."
);

program
    .option(
        "--ssl-cert <cert>",
        "Start with TLS enabled connections using given certificate."
    )
    .option(
        "--ssl-private-key <private_key>",
        "Specify the private key for given SSL certificate."
    )

program.parse(process.argv);



let authority_key_path = program.args[0];
let { sslCert: ssl_cert, sslPrivateKey: ssl_private_key } = program.opts();

if(_.isString(ssl_cert)){
    ssl_cert = fs.readFileSync(ssl_cert).toString();
}
if(_.isString(ssl_private_key)){
    ssl_private_key = fs.readFileSync(ssl_private_key).toString();
}

const server = new SAMRServer({
    ssl_cert, ssl_private_key,
    authority_public_keys: fs.readFileSync(authority_key_path).toString(),
});
