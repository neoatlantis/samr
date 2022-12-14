const { info, error, log, $socket } = require("../libs/logging");
const _ = require("lodash");
const { io } = require("socket.io-client");
const until  = require("../libs/until");
const events = require("events");
const StatusMonitor = require("./StatusMonitor");
const Authenticator = require("./Authenticator");
const OnEventPromiseResolver = require("./OnEventPromiseResolver");
const { $E, $ERR, $REF, $DEREF } = require("../protodef");


// bind funcs listed in a key-value object, to given instance
function load_module(instance, functree){
    if(functree.__init__) functree.__init__.call(instance);

    for(let func_name in functree){
        let func = functree[func_name];
        if(func_name == "__init__") continue;
        instance[func_name] = func.bind(instance);
    }
}


class SAMRClient extends events.EventEmitter {

    status;
    authenticator;
    #event_promise_resolver;
    #initialized = false; // true after first successful auth

    socket;

    constructor({
        url,
        socket_io_options={ reconnection: true },
        cert,
        private_key_armored,
        local_http_server,
    }){
        super();

        this.#event_promise_resolver = new OnEventPromiseResolver();

        this.status = new StatusMonitor(this);

        this.authenticator = new Authenticator(this, {
            cert, private_key_armored
        });

        this.authenticator.on("auth.status.changed", ({authenticated})=>{
            if(authenticated && !this.#initialized){
                this.emit("ready");
                this.#initialized = true;
            }
        })

        // this must be first
        load_module(this, require("./clientfuncs/join_and_leave"));
        // pubsub & rpc
        load_module(this, require("./clientfuncs/rpc"));
        load_module(this, require("./clientfuncs/pubsub"));

        this.socket = io(url, socket_io_options);

        /// #if !BROWSER
        if(local_http_server !== undefined){
            this.local_http_server =
                require("./local_http_server").call(this, local_http_server);
        }
        /// #endif

        this.#bind_events();
        this.status.start();
        this.authenticator.start();
    }

    // ---- run fn() once the client is ready, i.e. authenticated for the first
    //      time successfully. Also returns a Promise that resolves when ready.

    ready(fn){
        let wait_ready = until(()=>this.#initialized, 1000);
        wait_ready.then(()=>_.isFunction(fn)?fn():null);
        return wait_ready;
    }

    // ---- Listens for socket.io incoming events, and resolve a previous
    //      Promise with matching uuid.

    new_promise_of_event(event, uuid){
        return new Promise((resolve, reject)=>{
            // add this new Promise to resolver
            this.#event_promise_resolver.set({
                event, uuid, resolve, reject, timeout: 30,
            });
        })
    }

    // ---- bind events

    #bind_events(){
        const socket = this.socket;

        socket.on("connect", (s)=>this.#on_connection());
        socket.io.on("reconnect", (s)=>this.#on_reconnect());

        socket.on("error", (err)=>{
            error("Socket error received!" + err);
            /*if(err && _.startsWith(err.message, "fatal.")){
                socket.disconnect();
            }*/
        });

        socket.on($E("sys.user.status"), (e)=>this.status.on_status(e));

        socket.on("topic.event", this._on_topic_event.bind(this));
        socket.on("topic.invoke", this._on_topic_invoke.bind(this));

        let add_to_resolver = (event)=>{
            socket.on(event, (referenced_data)=>{
                this.#event_promise_resolver.handle({
                    event, referenced_data
                });
            });
        }
        add_to_resolver("auth.challenge");
        add_to_resolver("auth.success");
        add_to_resolver("topic.joined");
        add_to_resolver("topic.left");
        add_to_resolver("topic.published");
        add_to_resolver("topic.called");
        add_to_resolver("topic.result");

        // handle any events beginning with 'error.'
        socket.onAny((event_name, ...args)=>{
            if(!_.startsWith(event_name, "error.")) return;
            if(_.startsWith(event_name, "error.auth.")){
                // ask authentiator to handle
                this.authenticator.handle_error(event_name);
            }

            this.#event_promise_resolver.handle_error({
                event: event_name,
                referenced_data: args[0],
            });
        });

        // authenticator events passing
        this.authenticator.on("auth.status.changed", (e)=>{
            this.emit("auth.status.changed", e);
        });

    }


    // ---- on new connection

    #on_connection(){
        log(`Connected as ${$socket(this.socket)}`);
        this.authenticator.start();
    }

    #on_reconnect(){
        log(`Reconnected as socket ${$socket(this.socket)}`);
        this.authenticator.start(true);
    }

}

module.exports = SAMRClient;
