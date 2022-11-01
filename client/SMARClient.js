const _ = require("lodash");
const { io } = require("socket.io-client");
const events = require("events");
const Authenticator = require("./Authenticator");
const { $E, $ERR, $REF, $DEREF } = require("../protodef");



class SAMRClient extends events.EventEmitter {

    #authenticator;
    socket;

    topics; // emitter of incoming topic events

    constructor(args){
        super();
        this.topics = new events.EventEmitter();

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

        this.socket.on("connect", (s)=>this.#on_connection());
        this.socket.io.on("reconnect", (s)=>this.#on_reconnect());
    }


    #on_connection(){
        const socket = this.socket;
        console.log("connected");

        socket.on("error", (err)=>{
            console.error("Socket error received!", err);
            if(err && _.startsWith(err.message, "fatal.")){
                socket.disconnect();
            }
        });

        socket.on("auth.success", (e)=>this.#on_auth_success(e));
        socket.on("auth.failure", console.error);
        socket.on("topic.event", this.#on_topic_event.bind(this));

        this.#do_auth();
    }

    #on_reconnect(){
        this.#do_auth();
    }

    // ---- authenticator

    async #do_auth(){
        let proof = await this.#authenticator.authenticate(this.socket.id);
        let referenced = $REF(proof);
        console.log("Send auth proof, uuid=" + referenced.uuid());
        this.socket.emit("auth", referenced.data());
    }

    #on_auth_success(response){
        let { session_id } = $DEREF(response).data();
        console.log("Authenticatd to session:", session_id);
        this.#authenticator.set_session_id(session_id);
        this.emit("authenticated");
    }

    #on_auth_failure({ reason }){
        this.#authenticator.remove_session_id();
        setTimeout(()=>this.#do_auth(), 5000);
    }

    // ---- subscribe/unsubscribe to topic

    async subscribe(topic){
        let referenced = $REF(topic);
        let uuid = referenced.uuid();
        this.socket.emit($E("topic.subscribe"), referenced.data());
        // TODO make this a promise using given uuid
    }

    // ---- publish to topic

    async publish(topic, data){
        let referenced = $REF({
            topic, data
        });
        this.socket.emit($E("topic.publish"), referenced.data());
    }

    // ---- handler for incoming event

    async #on_topic_event(request_data){
        let request = $DEREF(request_data);
        let { topic, data } = (request.data() || {});

        this.topics.emit(topic, data, request.uuid());
    }


}

module.exports = SAMRClient;
