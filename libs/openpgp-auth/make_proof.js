const msgpack = require("msgpack-lite");
const openpgp = require("openpgp");


module.exports = async function({ proof, cert, private_key_armored }){
    let private_key = await openpgp.readKey({ armoredKey: private_key_armored });
    let public_key = private_key.toPublic();
    let payload = msgpack.encode({
        proof: Buffer.from(proof, 'utf-8'),
        cert: Buffer.from(cert, 'utf-8'),
    });

    let signed_payload = await openpgp.sign({
        message: await openpgp.createMessage({ binaryMessage: payload }),
        signingKeys: private_key,
        format: "binary",
    });

    let result = msgpack.encode({
        public_key: public_key,
        signed: signed_payload,
    });
    return result;
}
