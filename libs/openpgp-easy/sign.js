const msgpack = require("msgpack-lite");
const openpgp = require("openpgp");

async function sign_obj(data, signing_keys){
    data = msgpack.encode(data);
    return await openpgp.sign({
        message:
            await openpgp.createMessage({ binary: data }),
        signingKeys: signing_keys,
        format: "binary",
    });
}

module.exports = {
    sign_obj,
}
