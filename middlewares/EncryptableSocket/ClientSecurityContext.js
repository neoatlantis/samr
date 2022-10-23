const _ = require("lodash");
const events = require("events");
const openpgp = require("openpgp");
const nacl = require("tweetnacl");
const msgpack = require("msgpack-lite");

const SymmetricCipher = require("./SymmetricCipher");

class ClientSecurityContext extends events.EventEmitter {

    #encryption_started;
    #ephermal_secret_key;
    #cipher;
    #security_consultant;
    #session_id;

    constructor(security_consultant){
        super();
        if(!_.isFunction(security_consultant)){
            throw Error("SecurityConsultant is required.");
        }
        this.#security_consultant = security_consultant;
        this.#reset();
    }

    get_session_id(){ return this.#session_id }

    #reset(){
        this.#encryption_started = false;
        this.#ephermal_secret_key = null;
        this.#cipher = null;
        this.#session_id = null;
    }

    #accept_sharedsecret(shared_secret){
        this.#cipher = new SymmetricCipher(shared_secret);
        this.#ephermal_secret_key = null;
        this.#encryption_started = true;
        this.#session_id = Buffer.from(
            nacl.hash(shared_secret).slice(0, 8)
        ).toString("hex");
    }

    async handle_incoming(event, ...args){
        switch(event){
            case 'secure.start':
                return await this.on_start_encryption(args); break;
            case 'secure.data':
                return await this.on_incoming_encrypted_data(args); break;
            default:
                throw Error("fatal.secure.encryption.required");
        }
    }

    async handle_outgoing(event, ...args){
        if(_.isNil(this.#cipher)){
            throw Error("fatal.secure.encryption.not-ready");
        }
        let encrypted = await this.#cipher.encrypt_c2s([event, ...args]);
        this.emit("secure.data", encrypted);
    }

    async on_incoming_encrypted_data(args){
        if(!this.#encryption_started || _.isNil(this.#cipher)){
            throw Error("fatal.secure.encryption.required");
        }
        let decrypted = await this.#cipher.decrypt_s2c(_.get(args, 0));
        if(_.isNil(decrypted)) return;

        this.emit.apply(this, decrypted);
    }

    // Start encryption actively from client
    async start_encryption(){
        this.#reset();

        // 1. Generate server ephermal key for this session.
        let { publicKey, secretKey } = nacl.box.keyPair();

        // 2. Record local secret key
        this.#ephermal_secret_key = secretKey;

        // 2. Emit server answer
        this.emit("secure.start", Buffer.from(publicKey).toString("base64"));
    }

    // On server sent reply to secure.start event
    async on_start_encryption(args){

        // 1. Decode server answer
        let server_answer = null;
        try{
            server_answer = msgpack.decode(
                Buffer.from(_.get(args, 0), "base64"));
        } catch(e){
            throw Error("fatal.secure.server-answer.bad-format");
        }

        // 2. Parse and load server answer
        let server_pgp_key_binary   = _.get(server_answer, "c");
        let server_answer_signed = _.get(server_answer, "s");

        let server_pgp_key = null;
        try{
            server_pgp_key = await openpgp.readKey({
                binaryKey: server_pgp_key_binary,
            });
        } catch(e){
            throw Error("fatal.secure.server-answer.invalid-cert");
        }

        try{
            server_answer_signed = await openpgp.readMessage({
                binaryMessage: server_answer_signed,
            });
        } catch(e){
            throw Error("fatal.secure.server-answer.bad-format");
        }

        let security_consulting = {
            fingerprint: server_pgp_key.getFingerprint(),
        }
        if(!await this.#security_consultant(security_consulting)){
            console.debug("SecurityConsultant rejected server PGP key.");
            throw Error('fatal.secure.server-answer.not-accepted');
        }

        // 3. Verify and load server ephermal key
        let server_answer_plain = null;
        try{
            let verification_result = await openpgp.verify({
                message: server_answer_signed,
                verificationKeys: server_pgp_key,
                format: "binary",
            });
            let verified_all = await Promise.all(
                verification_result.signatures.map((e)=>e.verified));
            if(_.size(_.compact(verified_all)) < 1){
                throw Error("fatal.secure.server-answer.invalid-signature");
            }

            try{
                server_answer_plain = msgpack.decode(verification_result.data);
            } catch(e){
                throw Error("fatal.secure.server-answer.bad-format");
            }
        } catch(e){
            throw e;
        }

        // 4. Pair with server ephermal key and verify session
        let server_ephermal_public_key = _.get(server_answer_plain, "k");
        let server_session_id = _.get(server_answer_plain, "id");

        let shared_secret = nacl.box.before(
            server_ephermal_public_key,
            this.#ephermal_secret_key
        );

        if(!nacl.verify(
            server_session_id,
            nacl.hash(shared_secret).slice(0, 8)
        )){
            throw Error("fatal.secure.key-exchange-failed");
        }

        // 5. Save sharedsecret, and clean up
        this.#accept_sharedsecret(shared_secret);
        this.emit("secured");
    }

}

module.exports = ClientSecurityContext;
