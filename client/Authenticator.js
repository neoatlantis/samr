const make_proof = require("../libs/openpgp-auth/make_proof");
const _ = require("lodash");

class Authenticator {

    #cert;
    #private_key_armored;
    #session_id;

    constructor({ cert, private_key_armored }){
        this.#cert = cert;
        this.#private_key_armored = private_key_armored;
    }

    async authenticate(socket_id){
        let claim = {
            conn: socket_id,
            time: new Date(),
        };
        if(_.isString(this.#session_id)){
            claim.session_id = this.#session_id;
        }
        let made_proof = await make_proof({
            claim,
            cert: this.#cert,
            private_key_armored: this.#private_key_armored,
        });

        return Buffer.from(made_proof).toString("base64");
    }

    set_session_id(i){
        this.#session_id = i;
    }

}


module.exports = Authenticator;
