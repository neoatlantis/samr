const fs = require("fs");
const SAMRClient = require("../index").client;


const client = new SAMRClient({
    url: "ws://localhost:2222",
    socket_io_options: {
        reconnection: true,
        ca: fs.readFileSync("./keymaterials/cert.pem"),
    },
    cert: fs.readFileSync("./keymaterials/auth-cert.user1.asc").toString(),
    private_key_armored: fs.readFileSync("./keymaterials/pgp-userkey1.asc")
        .toString(),

    local_http_server: true,
});

client.socket.onAny((event, args)=>{
    console.error("| ", event, args);
})


client.ready(()=>{

    setInterval(()=>{
        try{
            client.publish("topic.events-only", {
                "current-time": new Date().toISOString(),
            }).catch(()=>{});
        } catch(e){
            console.log("error->", e);
        }
    }, 1000);

});
