const _ = require("lodash");
const events = require("events");
const ClientAuthenticator = require("./ClientAuthenticator");

const encryption_for_server =
    require('../middlewares/EncryptableSocket/setup_server');


class SAMRServer extends events.EventEmitter {

    #io;
    #authenticator;

    constructor(args){
        super();
        this.#init(args);
    }

    async #init({ ssl_cert, ssl_private_key, port=2222 }){
        this.https_server = require("https").createServer({
            cert: ssl_cert,
            key: ssl_private_key,
        });
        this.#io = require("socket.io")(this.https_server);

        /*this.#authenticator = new ClientAuthenticator();
        if(signing_keys){
            await this.#authenticator.initialize(signing_keys);
        }*/

        //let encryptable_socket = await encryption_for_server(private_key);
        //this.#io.use(encryptable_socket);
        this.#io.on("connection", (s)=>this.#on_connection(s));

        this.https_server.listen(port);
    }

    #on_connection(socket){
        console.log("New connection", socket.id);

        socket.on("disconnect", ()=>{
            console.log("remove all isteners");
            socket.removeAllListeners();
        });
        socket.on("error", (err)=>{
            console.error("Socket error received!", err);
            if(err && _.startsWith(err.message, "fatal.")){
                socket.disconnect();
            }
        });
        this.#on_ready(socket);
    }

    #on_ready(socket){

        // --- topic management

        socket.on("topic.subscribe", (room)=>{
            if(!_.isString(room)) return socket.emit("error.topic.invalid");
            // TODO authenticate socket
            socket.join(room);
            socket.emit("topic.subscribed", room);
        });

        socket.on("topic.unsubscribe", (room)=>{
            if(!_.isString(room)) return socket.emit("error.topic.invalid");
            socket.leave(room);
            socket.emit("topic.unsubscribed", room);
        });

        socket.on("topic.publish", async (room, data)=>{
            if(!_.isString(room)) return socket.emit("error.topic.invalid");
            // TODO check socket authentication
            if(_.get(data, "type") != "event"){
                return;
            }
            let uuid = _.get(data, "uuid");
            let realdata = _.get(data, "data");
            let sockets = await this.#io.in(room).fetchSockets();
            sockets.forEach((s)=>s.emit("topic.event", room, realdata));
            socket.emit("topic.published", uuid);
        });

    }


}

module.exports = SAMRServer;
