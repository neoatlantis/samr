const fs = require("fs");
const SAMRClient = require("../client/SAMRClient");
const _ = require("lodash");

const client = new SAMRClient({
    url: "ws://localhost:2222",
    socket_io_options: {
        reconnection: true,
        //ca: fs.readFileSync("./keymaterials/cert.pem"),
    },
    cert: fs.readFileSync("./keymaterials/auth-cert.user2.asc").toString(),
    private_key_armored: fs.readFileSync("./keymaterials/pgp-userkey2.asc")
        .toString(),
    local_http_server: true,
});

client.socket.onAny((event, args)=>{
    if(_.startsWith(event, "sys.")) return;
    console.error("| ", event, args);
})

let inited = false;
client.on("auth.status.changed", async (auth_status)=>{

    if(inited) return;
    if(!client.authenticator.authenticated) return;

    client.register("topic.rpc-2.add", (e)=>{
        let a = _.get(e, "a"),
            b = _.get(e, "b");
        if(!_.isNumber(a) || !_.isNumber(b)){
            throw Error("a and b must be numbers.");
        }
        return a+b;
    })

    inited = true;
});
