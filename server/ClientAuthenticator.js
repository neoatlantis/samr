const _ = require("lodash");
const openpgp = require("openpgp");

class ClientAuthenticator {
    /* A global authenticator (registered with server, not socket) for
    verifying client identities and claims.

    Authencation works as follows:

    1. the client obtain a cert somewhere, signed by holders of the private keys
       where their corresponding public keys are passed as arguments in this
       class as verifying_keys.
    2. the cert is a signed PGP message containing a MessagePack-encoded object
       with following format:
        {
            "bearer": <fingerprint of the users PGP public key, HEX>,
            "subjects": [
                ["space1.subspace1", "publish", "request", "response"],
                ...
            ],
            "valid_from": ...,
            "valid_to": ...
        }
    3. the user sents a MessagePack-encoded object with following format:
        {
            "user": <the user's PGP public key, containing a signature by any
                     holder of the verifying keys>,
            "cert": <Above signed cert>,
            "sid": <PGP message containing session_id, signed by user's PGP key>
        }
    */

    #verifying_keys = [];

    constructor(){
    }

    async initialize(verifying_keys){
        this.#verifying_keys = await openpgp.readKeys({
            armoredKeys: verifying_keys,
        });
    }



}

module.exports = ClientAuthenticator;
