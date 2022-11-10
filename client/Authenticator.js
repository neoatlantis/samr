const { info, error, log, $socket } = require("../libs/logging");
const make_proof = require("../libs/openpgp-auth/make_proof");
const _ = require("lodash");
const events = require("events");
const { $E, $ERR, $REF, $DEREF } = require("../protodef");


const RENEW_TIMEOUT = 60 * 1000; // renew session period



class Authenticator extends events.EventEmitter {

    #cert;
    #private_key_armored;
    #cached_session_id;

    authenticated = false;
    #started = false;
    #last_auth = 0;


    constructor(client, { cert, private_key_armored }){
        super();

        this.client = client;
        this.#cert = cert;
        this.#private_key_armored = private_key_armored;

        // start loop
        const period = 500;
        const authenticate_loop = async ()=>{
            if(!this.#started){
                setTimeout(authenticate_loop, period);
                return;
            }

            try{
                await this.auth();
            } catch(e){
                error(e);
            } finally {
                setTimeout(authenticate_loop, period * 10);
            }
        };
        authenticate_loop();
    }

    async #make_proof(challenge){
        let claim = {
            challenge,
            time: new Date(),
        };
        if(_.isString(this.#cached_session_id)){
            claim.session_id = this.#cached_session_id;
        }
        let made_proof = await make_proof({
            claim,
            cert: this.#cert,
            private_key_armored: this.#private_key_armored,
        });

        return Buffer.from(made_proof).toString("base64");
    }

    async start(restart){
        this.#started = true;
        if(restart){
            this.#last_auth = 0;
        }
    }

    async auth(){
        const now = new Date().getTime();
        if(
            this.authenticated &&
            now - this.#last_auth < RENEW_TIMEOUT
        ){
            return;
        }

        let hello_request = $REF(null);
        let hello_promise = this.client.new_promise_of_event(
            "auth.challenge", hello_request.uuid());
        this.client.socket.emit("auth.hello", hello_request.data());

        let { challenge } = $DEREF(await hello_promise).data();
        log(`Authenticating, challenge=${challenge}`);

        let proof = await this.#make_proof(challenge);
        let verify_request = $REF(proof);
        let verify_promise = this.client.new_promise_of_event(
            "auth.success", verify_request.uuid());
        this.client.socket.emit("auth.verify", verify_request.data());

        try{
            let verify_result = await verify_promise;
            this.#on_auth_success(verify_result);
        } catch(e){
            // auth failure, e.message containing description
            this.#on_auth_failure(e.reason);
        }
    }

    async handle_error(event_name){
        /*
            'error.auth.failure',
            'error.auth.unauthenticated',
            'error.auth.insufficient',
        */
        if(event_name == "error.auth.insufficient") return;

        // similar as on_auth_failure, restart authentication!
        this.emit("auth.status.changed", {
            session_changed: false,
            authenticated: false,
        });
        this.#cached_session_id = null;
        this.authenticated = false;
        this.#last_auth = 0;
    }

    #on_auth_success(response){
        let { session_id } = $DEREF(response).data();
        info(`${$socket(this.client.socket)} Authenticatd.`);

        let session_changed = (this.#cached_session_id != session_id);

        this.#cached_session_id = session_id;

        this.#last_auth = new Date().getTime();
        this.authenticated = true;

        this.emit("auth.status.changed", {
            session_changed,
            authenticated: true,
        });
    }

    #on_auth_failure(reason){
        this.#cached_session_id = null;
        this.authenticated = false;
        this.#last_auth = 0;
        error("Authentication failed, reason=" + reason);
        this.emit("auth.status.changed", {
            session_changed: false,
            authenticated: false,
        });
    }
}


module.exports = Authenticator;
