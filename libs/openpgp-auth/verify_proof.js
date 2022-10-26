const msgpack = require("msgpack-lite");
const openpgp = require("openpgp");
const _ = require("lodash");
const createOpenPGPCertReader = require("./OpenPGPCertReader");

class OpenPGPProofResult {

    #error;
    #reason;

    #claim;
    #cert_parsed;

    constructor(err, result){
        if(err){
            this.#error = true;
            this.#reason = err;
        } else {
            this.#error = false;
            this.#claim = result.claim;
            this.#cert_parsed = result.cert;
        }
    }

    json(){
        if(this.#error){
            return {
                error: this.#reason,
            }
        }
        return {
            result: {
                claim: this.#claim,

            }
        }
    }

}




module.exports = async function(proof, issuer_public_key){
    let proof_obj = null;
    try{
        proof_obj = msgpack.decode(proof);
    } catch(e){
        return new OpenPGPProofResult("Failed decoding proof.");
    }

    let { public_key: public_key_binary, signed: signed_binary } = proof_obj;

    let public_key = null;
    try{
        public_key = await openpgp.readKey({ binaryKey: public_key_binary });
    } catch(e){
        console.log(e);
        return new OpenPGPProofResult("Failed reading proof public key.");
    }

    let signed = null;
    try{
        signed = await openpgp.readMessage({ binaryMessage: signed_binary });
    } catch(e){
        return new OpenPGPProofResult("Failed reading signature payload.");
    }

    let verifying = await openpgp.verify({
        message: signed,
        verificationKeys: public_key,
        format: "binary",
    });
    let verification_tasks = await Promise.all(
        verifying.signatures.map((e)=>e.verified));
    if(_.includes(verification_tasks, false)){
        return new OpenPGPProofResult("Signature invalid.");
    }

    let signed_obj = null;
    try{
        signed_obj = msgpack.decode(verifying.data);
    } catch(e){
        return new OpenPGPProofResult("Failed reading signature payload.");
    }

    // ----

    let cert_reader = await createOpenPGPCertReader(issuer_public_key);
    let cert_parsed = await cert_reader.read(signed_obj.cert);

    if(cert_parsed.get_bearer_fingerprint() != public_key.getFingerprint()){
        return new OpenPGPProofResult("Cert not issued to signing public key.");
    }
    console.log(cert_parsed);

    return new OpenPGPProofResult(null, {
        claim: signed_obj.claim,
        cert: cert_parsed,
    });

}
