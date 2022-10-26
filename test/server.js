const SAMRServer = require("../server/SAMRServer");
const fs = require("fs");

const server = new SAMRServer({
    ssl_cert: fs.readFileSync("./keymaterials/cert.pem"),
    ssl_private_key: fs.readFileSync("./keymaterials/key.pem"),
});
