const _ = require("lodash");
const { io } = require("socket.io-client");
const events = require("events");
const Authenticator = require("./Authenticator");
const OnEventPromiseResolver = require("./OnEventPromiseResolver");
const { $E, $ERR, $REF, $DEREF } = require("../protodef");



class SAMRClient extends events.EventEmitter {

    #authenticator;
    #event_promise_resolver;
    #joined_rooms;
    #rpc_endpoints;

    #events_bound = false;

    socket;

    topics; // emitter of incoming topic events

    constructor(args){
        super();
        this.topics = new events.EventEmitter();

        this.#rpc_endpoints = new Map();
        this.#joined_rooms = new Set();
        this.#event_promise_resolver = new OnEventPromiseResolver();

        this.#init(args);
    }

    async #init({
        url,
        socket_io_options={ reconnection: true },
        cert,
        private_key_armored
    }){
        this.socket = io(url, socket_io_options);

        this.#authenticator = new Authenticator({
            cert, private_key_armored
        });

        this.#bind_events();
    }

    // ---- register/unregister RPC endpoint

    rpc_register(method, handler){
        this.#rpc_endpoints.set(method, handler);
        return this.join(method);
    }

    rpc_unregister(method){
        this.#rpc_endpoints.delete(method);
        return this.leave(method);
    }

    // ---- Listens for socket.io incoming events, and resolve a previous
    //      Promise with matching uuid.

    #new_promise_of_event(event, uuid){
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

        socket.on("auth.success", (e)=>this.#on_auth_success(e));
        socket.on("auth.failure", console.error);
        socket.on("topic.event", this.#on_topic_event.bind(this));
        socket.on("topic.invoke", this.#on_topic_invoke.bind(this));

        let add_to_resolver = (event)=>{
            socket.on(event, (referenced_data)=>{
                this.#event_promise_resolver.handle({
                    event, referenced_data
                });
            });
        }
        add_to_resolver("auth.challenge");
        add_to_resolver("topic.joined");
        add_to_resolver("topic.left");
        add_to_resolver("topic.published");
        add_to_resolver("topic.called");
        add_to_resolver("topic.result");

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
        console.log("connected");
        this.#do_auth();
    }

    #on_reconnect(){
        this.#do_auth();
    }

    // ---- authenticator

    async #do_auth(){
        let hello_request = $REF(null);
        let hello_promise = this.#new_promise_of_event(
            "auth.challenge", hello_request.uuid())
        this.socket.emit("auth.hello", hello_request.data());

        let { challenge } = $DEREF(await hello_promise).data();

        let proof = await this.#authenticator.authenticate(challenge);
        let referenced = $REF(proof);
        this.socket.emit("auth.verify", referenced.data());
    }

    #on_auth_success(response){
        let { session_id } = $DEREF(response).data();
        console.log("Authenticatd to session:", session_id);
        this.#authenticator.set_session_id(session_id);
        this.emit("authenticated");

        this.#joined_rooms.forEach((topic)=>{
            this.join(topic);
        });
    }

    #on_auth_failure({ reason }){
        this.#authenticator.remove_session_id();
        setTimeout(()=>this.#do_auth(), 5000);
    }

    // ---- join/leave a topic

    join(topic){
        let referenced = $REF({ topic });
        let uuid = referenced.uuid();

        let ret = this.#new_promise_of_event("topic.joined", uuid);
        this.socket.emit($E("topic.join"), referenced.data());
        return ret.then(()=>{
            this.#joined_rooms.add(topic);
        });
    }

    leave(topic){
        let referenced = $REF({ topic });
        let uuid = referenced.uuid();

        let ret = this.#new_promise_of_event("topic.left", uuid);
        this.socket.emit($E("topic.leave"), referenced.data());
        return ret.then(()=>{
            this.#joined_rooms.delete(topic);
        });
    }

    // ---- publish to topic

    publish(topic, data){
        let referenced = $REF({ topic, data });
        let ret = this.#new_promise_of_event(
            "topic.published", referenced.uuid());
        this.socket.emit($E("topic.publish"), referenced.data());
        return ret;
    }

    // ---- handler for incoming event

    async #on_topic_event(request_data){
        let request = $DEREF(request_data);
        let { topic, data } = (request.data() || {});

        this.topics.emit(topic, data, request.uuid());
    }

    // ---- RPC call

    async call(topic, data){
        let referenced = $REF({ topic, data });
        let called_promise = this.#new_promise_of_event(
            "topic.called", referenced.uuid());
        this.socket.emit($E("topic.call"), referenced.data());

        let invocation_id = null;
        try{
            let called_result = await called_promise;
            invocation_id = _.get(
                $DEREF(called_result).data(),
                "invocation"
            );
        } catch(e){
            throw e;
        }

        return this.#new_promise_of_event("topic.result", invocation_id);
    }

    // --- handler for RPC remote invocation

    async #on_topic_invoke(request_data){
        let request = $DEREF(request_data);
        let { topic, data } = request.data() || {};
        if(!this.#rpc_endpoints.has(topic)) return;

        try{
            let result = await this.#rpc_endpoints.get(topic)(data);
            this.socket.emit(
                $E("topic.yield"),
                $REF({ topic, result }, request.uuid()).data()
            );
        } catch(e){
            this.socket.emit(
                $E("topic.yield"),
                $REF({ topic, error: e.message }, request.uuid()).data()
            );
        }
    }

}

module.exports = SAMRClient;
