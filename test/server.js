const SAMRServer = require("../index").server;
const fs = require("fs");

const server = new SAMRServer({
    /*ssl_cert: fs.readFileSync("./keymaterials/cert.pem"),
    ssl_private_key: fs.readFileSync("./keymaterials/key.pem"),*/
    authority_public_keys:
        fs.readFileSync("./keymaterials/pgp-authority-key.asc").toString(),
});
