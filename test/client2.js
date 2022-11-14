const fs = require("fs");
const SAMRClient = require("../client/SAMRClient");

const client = new SAMRClient({
    url: "wss://localhost:2222",
    socket_io_options: {
        reconnection: true,
        ca: fs.readFileSync("./keymaterials/cert.pem"),
    },
    cert: fs.readFileSync("./keymaterials/auth-cert.user2.asc").toString(),
    private_key_armored: fs.readFileSync("./keymaterials/pgp-userkey2.asc")
        .toString(),
});

client.socket.onAny((event, args)=>{
    console.error("| ", event, args);
})

let inited = false;
client.on("auth.status.changed", async (auth_status)=>{

    if(inited) return;
    if(!client.authenticator.authenticated) return;

    client.subscribe("topic.events-only", (data)=>{
        console.log("topic.event", data);
    });


    /*
    console.log(">> Try call topic.rpc-1");
    try{
        let result = await client.call("topic.rpc-1", { hello: "world "});
        console.log(">> Called.", result);
    } catch(e){
        console.log(">> Error:", e);
    }*/

    inited = true;
});
