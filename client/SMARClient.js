const _ = require("lodash");
const { io } = require("socket.io-client");
const events = require("events");

class SAMRClient extends events.EventEmitter {

    #io;

    constructor(args){
        super();
        this.#init(args);
    }

    async #init({ url, socket_io_options={}, private_key, signing_keys }){
        this.#io = io(url, socket_io_options);

        this.#authenticator = new ClientAuthenticator();
        if(signing_keys){
            await this.#authenticator.initialize(signing_keys);
        }

        //let encryptable_socket = await encryption_for_server(private_key);
        //this.#io.use(encryptable_socket);
        this.#io.on("connection", (s)=>this.#on_connection(s));
    }


}
