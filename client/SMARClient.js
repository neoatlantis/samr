const { info, error, log, $socket } = require("../libs/logging");
const _ = require("lodash");
const { io } = require("socket.io-client");
const events = require("events");
const Authenticator = require("./Authenticator");
const OnEventPromiseResolver = require("./OnEventPromiseResolver");
const { $E, $ERR, $REF, $DEREF } = require("../protodef");


// bind funcs listed in a key-value object, to given instance
function load_module(instance, functree){
    for(let func_name in functree){
        let func = functree[func_name];
        instance[func_name] = func.bind(instance);
    }
}


class SAMRClient extends events.EventEmitter {

    authenticator;
    #event_promise_resolver;
    joined_rooms;
    rpc_endpoints;

    #events_bound = false;

    socket;

    topics; // emitter of incoming topic events

    constructor(args){
        super();
        this.topics = new events.EventEmitter();

        this.rpc_endpoints = new Map();
        this.joined_rooms = new Set();
        this.#event_promise_resolver = new OnEventPromiseResolver();

        load_module(this, require("./clientfuncs/join_and_leave"));
        load_module(this, require("./clientfuncs/rpc"));
        load_module(this, require("./clientfuncs/pubsub"));

        this.#init(args);
    }

    async #init({
        url,
        socket_io_options={ reconnection: true },
        cert,
        private_key_armored
    }){
        this.socket = io(url, socket_io_options);

        this.authenticator = new Authenticator(this, {
            cert, private_key_armored
        });

        this.#bind_events();
        this.authenticator.start();
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
        if(this.#events_bound) return;

        socket.on("connect", (s)=>this.#on_connection());
        socket.io.on("reconnect", (s)=>this.#on_reconnect());

        socket.on("error", (err)=>{
            console.error("Socket error received!", err);
            if(err && _.startsWith(err.message, "fatal.")){
                socket.disconnect();
            }
        });

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
            if(_.startsWith(event_name, "error.")){
                this.#event_promise_resolver.handle_error({
                    referenced_data: args[0],
                });
            }
        });

        this.#events_bound = true;
    }


    // ---- on new connection

    #on_connection(){
        log(`Connected as ${$socket(this.socket)}`);
        this.authenticator.start();
    }

    #on_reconnect(){
        this.authenticator.start();
    }

}

module.exports = SAMRClient;
