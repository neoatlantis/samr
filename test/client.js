const ClientIO = require("socket.io-client");
const fs = require("fs");
const nacl = require("tweetnacl");

/*const encryption_for_client = require("../middlewares/EncryptableSocket/setup_client")(async function security_consulatant(consulting){
    console.log("Consulting:", consulting);
    return true;
});*/


const client = ClientIO("wss://localhost:2222", {
    reconnection: true,
    ca: fs.readFileSync("./keymaterials/cert.pem"),
 });
//encryption_for_client(client);

client.on("connect", function(){
    console.log("client connected...");
});

client.on("disconnect", function(){
    console.log("disconnected");
});

client.on("secured", function(){
    console.log("client connection secured.");

    setInterval(async ()=>{
        async function send(){
            let uuid = Math.random().toString();
            let ret = new Promise((resolve, reject)=>{
                client.once("topic.published", (retuuid)=>{
                    if(uuid == retuuid) resolve();
                });
            })
            client.emit("topic.publish", "test", {
                type: "event",
                uuid: uuid,
                data: {
                    hello: "world",
                    client_id: client.get_session_id(),
                }
            });
            return ret;
        }
        await send();
        console.log("event published");
    }, 1000);

    client.emit("topic.subscribe", "test");
});

client.on("topic.event", (topic, data)=>{
    console.log("Received topic event:", topic, data);
});

client.on("topic.published", (uuid)=>{
    console.log("Topic published: uuid=", uuid);
})

client.on("topic.subscribed", (topic)=>{
    console.log("Subscribed to topic:", topic);
})
