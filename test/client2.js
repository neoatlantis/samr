const fs = require("fs");
const SAMRClient = require("../client/SMARClient");

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

client.once("authenticated", async ()=>{

    await client.join("topic.rpc-1");
    await client.join("topic.rpc-2");
    await client.join("topic.events-only");


    console.log(">> Try call topic.rpc-1");
    try{
        await client.call("topic.rpc-1", { hello: "world "});
        console.log(">> Called.");
    } catch(e){
        console.log(">> Error:", e);
    }


});
