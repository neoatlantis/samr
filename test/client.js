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

client.once("authenticated", async ()=>{

    console.log(">> Try joining topic.full")
    await client.join("topic.full");
    console.log(">> Joined topic.full");

    console.log(">> Try joining topic.not-authorized")
    try{
        await client.join("topic.not-authorized");
    } catch(e){
        console.log(">> Error:", e);
    }

    console.log(">> Try publishing to topic.full");
    await client.publish("topic.full", { hello: "world" });
    console.log(">> Published.");


    console.log(">> Try publishing to topic.not-authorized");
    try{
        await client.publish("topic.not-authorized", { hello: "world" });
    } catch(e){
        console.log(">> Error:", e);
    }


    console.log(">> Try call topic.full");
    try{
        await client.call("topic.full", { hello: "world "});
    } catch(e){
        console.log(">> Error:", e);
    }


});

client.topics.on("topic.full", (data, uuid)=>{
    console.log("Incoming topic / topic.full", uuid, data);
})
