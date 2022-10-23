const _ = require("lodash");
const events = require("events");
const openpgp = require("openpgp");
const nacl = require("tweetnacl");
const msgpack = require("msgpack-lite");

const SymmetricCipher = require("./SymmetricCipher");


class ServerSecurityContext extends events.EventEmitter {

    #encryption_started;
    #pgp_private_key;
    #pgp_public_key_binary;
    #cipher;

    constructor(pgp_private_key, pgp_public_key_binary){
        super();

        this.#encryption_started = false;
        this.#pgp_private_key = pgp_private_key;
        this.#pgp_public_key_binary = pgp_public_key_binary;
    }

    #accept_sharedsecret(shared_secret){
        this.#cipher = new SymmetricCipher(shared_secret);
        this.#encryption_started = true;
    }

    async handle_incoming(args){
        let event_name = _.get(args, 0); // secure.xxxxxx

        switch(event_name){
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
        let encrypted = await this.#cipher.encrypt_s2c([event, ...args]);
        this.emit("secure.data", encrypted);
    }

    async on_incoming_encrypted_data(args){
        // We may mutate `args` to cause the actual event be changed

        if(!this.#encryption_started || _.isNil(this.#cipher)){
            throw Error("fatal.secure.encryption.required");
        }
        let decrypted = await this.#cipher.decrypt_c2s(_.get(args, 1));
        if(_.isNil(decrypted)) return;

        _.remove(args);
        decrypted.forEach((e)=>args.push(e));
    }

    async on_start_encryption(args){
        if(this.#encryption_started){
            throw Error("fatal.secure.encryption.already-started");
        }

        // 1. Generate server ephermal key for this session.
        let { publicKey, secretKey } = nacl.box.keyPair();

        // 2. Pair private key with client sent public key, and set
        //    shared_secret
        let client_public_key_base64 = _.get(args, 1);
        let shared_secret = null;
        try{
            let client_public_key = Buffer.from(
                client_public_key_base64, "base64");
            shared_secret = nacl.box.before(client_public_key, secretKey);
            this.#accept_sharedsecret(shared_secret);
        } catch(e){
            console.error(e);
            throw Error("fatal.secure.encryption.invalid-client-hello");
        }

        // 3. Generate server answer, sign it with server PGP key

        let server_answer_plain = msgpack.encode({
            k: publicKey,
            id: nacl.hash(shared_secret).slice(0, 8),
        });

        let server_answer_signed = await openpgp.sign({
            message:
                await openpgp.createMessage({ binary: server_answer_plain }),
            signingKeys: this.#pgp_private_key,
            format: "binary",
        });

        let server_answer = msgpack.encode({
            s: server_answer_signed,
            c: this.#pgp_public_key_binary,
        });

        // 4. Emit server answer

        this.emit(
            "secure.start",
            Buffer.from(server_answer).toString("base64")
        );

        // 5. Declare encryption encryption started
        this.#encryption_started = true;
        _.remove(args);
        args.push(["secured"]);

    }

}

module.exports = ServerSecurityContext;
