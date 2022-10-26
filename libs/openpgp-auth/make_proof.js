const msgpack = require("msgpack-lite");
const openpgp = require("openpgp");


module.exports = async function({ claim, cert, private_key_armored }){
    let private_key = await openpgp.readKey({ armoredKey: private_key_armored });
    let public_key = private_key.toPublic().write();
    let payload = msgpack.encode({
        claim: claim,
        cert: cert,
    });

    let signed_payload = await openpgp.sign({
        message: await openpgp.createMessage({ binary: payload }),
        signingKeys: private_key,
        format: "binary",
    });

    let result = msgpack.encode({
        public_key: public_key,
        signed: signed_payload,
    });
    return result;
}
