const openpgp = require("openpgp");
const crypto = require("crypto");

class OpenPGPCertIssuer{

    #issuer_private_key;

    #data_valid_duration = 31 * 86400;
    #data_bearer_fingerprint = "";
    #data_tags = [];

    constructor(issuer_private_key){
        this.#issuer_private_key = issuer_private_key;
    }

    validity_duration(s){
        this.#data_valid_duration = s;
        return this;
    }

    bearer_fingerprint(s){
        this.#data_bearer_fingerprint = s;
        return this;
    }

    tag(t){
        this.#data_tags.push(t);
        return this;
    }

    #get_id(){
        let id = Buffer.alloc(8);
        crypto.randomFillSync(id);
        return id.toString("hex");
    }

    async go(){
        let cert_id = this.#get_id();
        let validity_start = new Date().toISOString();
        let validity_end = new Date(
            new Date(validity_start).getTime() +
            this.#data_valid_duration * 1000
        ).toISOString();
        let cert_request = [
            `id: ${cert_id}`,
            `bearer: ${this.#data_bearer_fingerprint}`,
            `validity:`,
            ` start: ${validity_start}`,
            ` end: ${validity_end}`,
            "tags:",
        ];
        for(let entry of this.#data_tags) cert_request.push(` - ${entry}`);
        cert_request = cert_request.join("\n") + "\n";
        let message = await openpgp.createCleartextMessage({
            text: cert_request,
        });
        return await openpgp.sign({
            message, //
            signingKeys: this.#issuer_private_key,
        });
    }

}

module.exports = async function(private_key_armored){
    let k = await openpgp.readKey({ armoredKey: private_key_armored });
    return new OpenPGPCertIssuer(k);
}
