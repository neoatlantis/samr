const _ = require("lodash");
const events = require("events");
const protohandlers = require("./protohandlers");
const openpgp = require("openpgp");
const session_manager = require("./sessions");
const { info, error, $socket } = require("../libs/logging");
const { $E, $ERR, $REF, $DEREF } = require("../protodef");
const get_express_server = require("./local_http_server");
const redis_enabled = require("./redis_enabled");
const { createAdapter } = require("@socket.io/redis-adapter");

const SocketAuthorizationHolder = require("./SocketAuthorizationHolder");

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
        redis,
        ssl_cert,
        ssl_private_key,
        authority_public_keys,
        port=2222
    }){
        // config http server
        this.#config_server({ port, ssl_cert, ssl_private_key });

        // start redis connection
        await redis_enabled.init(redis);
        let redis_pub_client = redis_enabled.client();
        let redis_sub_client = redis_pub_client.duplicate();

        // config and start socket.io server
        this.io = require("socket.io")(this.base_server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
            }
        });
        this.io.adapter(createAdapter(redis_pub_client, redis_sub_client));

        // parse authority keys

        this.authority_public_keys = await openpgp.readKeys({
            armoredKeys: authority_public_keys,
        });

        this.io.on("connection", (s)=>this.#on_connection(s));
    }

    #config_server({ port, ssl_cert, ssl_private_key }){
        const app = get_express_server.call(this);

        if(ssl_cert || ssl_private_key){
            this.base_server = require("https").createServer({
                cert: ssl_cert,
                key: ssl_private_key,
            }, app);
        } else {
            this.base_server = require("http").createServer(app);
        }

        this.base_server.listen(port);
        console.log("Server listening on localhost:" + port);
    }

    #customize_socket(socket){
        socket.auths = new SocketAuthorizationHolder();
    }

    #on_connection(socket){
        info(`New connection: ${$socket(socket)}`);

        this.#customize_socket(socket);

        socket.on("disconnect", ()=>{
            info(`${$socket(socket)} disconnected. Removing all listeners.`);
            socket.removeAllListeners();
        });
        socket.on("error", (err)=>{
            error(`${$socket(socket)}: error received! ${err}`);
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
            let socket_usercert = _.get(socket, "usercert", null);
            if(
                _.isNil(socket_session) ||
                _.isNil(socket_usercert)
            ){
                throw Error("Requires authentication.");
            }
            if(socket_session.is_expired()){
                throw Error("Session expired.");
                return false;
            }
        } catch(e){
            // no available session, emit error
            socket.emit(
                $ERR("error.auth.unauthenticated"),
                e.message
            );
            return false;
        }
        return true;
    }


}

module.exports = SAMRServer;
