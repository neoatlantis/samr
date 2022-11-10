const fs = require("fs");
const SAMRClient = require("../client/SMARClient");


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


let inited = false;
client.on("auth.status.changed", async (auth_status)=>{

    if(inited) return;
    if(!client.authenticator.authenticated) return;

    /*await client.register("topic.rpc-1", ({hello})=>{
        return { "fulltext": hello };
    });*/

//    await client.call("topic.rpc-2", {});

    setInterval(()=>{
        try{
            client.publish("topic.events-only", {
                "current-time": new Date().toISOString(),
            }).catch(()=>{});
        } catch(e){
            console.log("error->", e);
        }
    }, 1000);

    inited = true;

});

client.topics.on("topic.full", (data, uuid)=>{
    console.log("Incoming topic / topic.full", uuid, data);
})
