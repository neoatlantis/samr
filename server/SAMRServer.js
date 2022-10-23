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

    async #init({ io, private_key, signing_keys }){
        this.#io = io;

        this.#authenticator = new ClientAuthenticator();
        if(signing_keys){
            await this.#authenticator.initialize(signing_keys);
        }

        let encryptable_socket = await encryption_for_server(private_key);
        this.#io.use(encryptable_socket);
        this.#io.on("connection", (s)=>this.#on_connection(s));
    }

    #on_connection(socket){
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
        socket.on("secured", ()=>this.#on_secured(socket));
    }

    #on_secured(socket){

        this.emit("secure-connection", socket);
    }


}

module.exports = SAMRServer;
