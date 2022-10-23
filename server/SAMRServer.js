const _ = require("lodash");

const encryption_for_server =
    require('../middlewares/EncryptableSocket/setup_server');


class SAMRServer {

    #io;

    constructor(args){
        this.#init(args);
    }

    async #init({ io, private_key }){
        this.#io = io;

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

        socket.on("secured", ()=>{
            console.log("server socket.secured");
        })


    }


}

module.exports = SAMRServer;
