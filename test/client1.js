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

client.rpc_register("topic.rpc-1", ({hello})=>{
    return { "fulltext": hello };
});


client.once("authenticated", async ()=>{


    await client.join("topic.rpc-1.subtopic1");
    await client.join("topic.rpc-2.subtopic2");
    await client.join("topic.events-only");

});

client.topics.on("topic.full", (data, uuid)=>{
    console.log("Incoming topic / topic.full", uuid, data);
})
