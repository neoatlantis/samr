const _ = require("lodash");
const events = require("events");
const ClientAuthenticator = require("./ClientAuthenticator");
const protohandlers = require("./protohandlers");
const openpgp = require("openpgp");

const encryption_for_server =
    require('../middlewares/EncryptableSocket/setup_server');


class SAMRServer extends events.EventEmitter {

    io;
    authority_public_keys = [];

    #authenticator;

    constructor(args){
        super();
        this.#init(args);
    }

    async #init({
        ssl_cert,
        ssl_private_key,
        authority_public_keys,
        port=2222
    }){
        this.https_server = require("https").createServer({
            cert: ssl_cert,
            key: ssl_private_key,
        });
        this.io = require("socket.io")(this.https_server);
        
        this.authority_public_keys = await openpgp.readKeys({
            armoredKeys: authority_public_keys,
        });

        /*this.#authenticator = new ClientAuthenticator();
        if(signing_keys){
            await this.#authenticator.initialize(signing_keys);
        }*/

        //let encryptable_socket = await encryption_for_server(private_key);
        //this.io.use(encryptable_socket);
        this.io.on("connection", (s)=>this.#on_connection(s));

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

        for(let event_name in protohandlers){
            socket.on(
                event_name,
                protohandlers[event_name].bind(this, socket)
            );
        }


    }


}

module.exports = SAMRServer;
