const _ = require("lodash");
const { io } = require("socket.io-client");
const events = require("events");
const Authenticator = require("./Authenticator");

class SAMRClient extends events.EventEmitter {

    #socket;
    #authenticator;

    constructor(args){
        super();
        this.#init(args);
    }

    async #init({
        url,
        socket_io_options={ reconnection: true },
        cert,
        private_key_armored
    }){
        this.#socket = io(url, socket_io_options);

        this.#authenticator = new Authenticator({
            cert, private_key_armored
        });

        this.#socket.on("connect", (s)=>this.#on_connection());
    }

    async #do_auth(){
        let proof = await this.#authenticator.authenticate(this.#socket.id);

        this.#socket.emit("auth", proof);
    }

    #on_connection(){
        console.log("connected");

        this.#socket.on("auth.success", console.log);
        this.#socket.on("auth.failure", console.error);

        this.#do_auth();

    }



}

module.exports = SAMRClient;
