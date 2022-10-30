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
        const socket = this.#socket;
        console.log("connected");

        socket.on("error", (err)=>{
            console.error("Socket error received!", err);
            if(err && _.startsWith(err.message, "fatal.")){
                socket.disconnect();
            }
        });

        socket.on("auth.success", (e)=>this.#on_auth_success(e));
        socket.on("auth.failure", console.error);

        this.#do_auth();
    }


    #on_auth_success({ session_id }){
        console.log("Authenticatd to session:", session_id);
        this.#authenticator.set_session_id(session_id);
    }

    #on_auth_failure({ reason }){
        this.#authenticator.remove_session_id();
        setTimeout(()=>this.#do_auth(), 5000);
    }



}

module.exports = SAMRClient;
