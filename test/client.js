const fs = require("fs");
const SAMRClient = require("../client/SMARClient");

/*const encryption_for_client = require("../middlewares/EncryptableSocket/setup_client")(async function security_consulatant(consulting){
    console.log("Consulting:", consulting);
    return true;
});*/


const client = new SAMRClient({
    url: "wss://localhost:2222",
    socket_io_options: {
        reconnection: true,
        ca: fs.readFileSync("./keymaterials/cert.pem"),
    },
    cert: fs.readFileSync("./keymaterials/auth-cert.user1.asc").toString(),
    private_key_armored: fs.readFileSync("./keymaterials/pgp-userkey1.asc")
        .toString(),
});

client.socket.onAny((event, args)=>{
    console.error("| ", event, args);
})

client.once("authenticated", ()=>{

    client.subscribe("topic.abcd.efg");
    client.subscribe("topic.r.generic-topic1");

});
