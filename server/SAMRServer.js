const _ = require("lodash");
const events = require("events");
const protohandlers = require("./protohandlers");
const openpgp = require("openpgp");
const session_manager = require("./sessions");

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
        })  ;
        this.#on_ready(socket);
    }

    #on_ready(socket){
        /* attach protocol handler functions */
        for(let event_name in protohandlers){
            let decorated_handler = this.#_decorate_handler(
                protohandlers[event_name]);
            socket.on(event_name, decorated_handler.bind(this, socket));
        }
    }

    #_decorate_handler(original_func){
        /* Decorates the original handler function with a series of
         * preconditions, each will be called with the same arguments as the
         * finally original function. However if any of the preconditions did
         * not return true, the final function will not run.
         */
        const self = this;
        let flag_require_session = original_func.require_session;

        let call_fns = [];
        if(flag_require_session) call_fns.push(this.#_decorator_require_session);

        let decorating_func = async function(){
            for(let fn of call_fns){
                if(!await fn.apply(self, arguments)) return;
            }
            await original_func.apply(self, arguments);
        }
        return decorating_func;
    }

    #_decorator_require_session(socket){
        /* The "require_session" decorator. Handler function must have its
         * attribute "require_session" set to true. This precondition will check
         * that the socket connection is indeed authenticated and have a valid
         * session.
         */
        try{
            let socket_session_id = _.get(socket, "session_id", null);
            let socket_session = session_manager.get_session(socket_session_id);
            if(_.isNil(socket_session)) throw Error("Requires authentication.");
            if(socket_session.is_expired()){
                socket.emit("fatal.session.expired");
                return false;
            }
        } catch(e){
            // no available session, emit error
            socket.emit("auth.failure", { reason: e.message });
            return false;
        }
        return true;
    }


}

module.exports = SAMRServer;
