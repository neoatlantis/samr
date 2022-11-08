const openpgp = require("openpgp");
const crypto = require("crypto");
const _ = require("lodash");
const yaml = require("js-yaml");
const uri = require("../uri");
const OpenPGPCertResult = require("./OpenPGPCertResult");


class OpenPGPCertReader{

    #verifying_keys;

    constructor(verifying_keys){
        this.#verifying_keys = verifying_keys;
    }

    async read(cert){
        let message = null;
        try{
            message = await openpgp.readCleartextMessage({
                cleartextMessage: cert,
            });
        } catch(e){
            return null;
        }

        let verify_task = null;
        try{
            verify_task = await openpgp.verify({
                message,
                verificationKeys: this.#verifying_keys,
                format: "utf8",
            });
        } catch(e){
            return null;
        }

        let verified_n = await Promise.all(
            verify_task.signatures.map((e)=>e.verified));
        if(_.includes(verified_n, false)) return null;

        return await this.#verify_payload(verify_task.data);
    }

    async #verify_payload(data){
        let obj = null;
        try{
            obj = yaml.load(data);
        } catch(e){
            console.log(e);
            return null;
        }

        let format_validity = (
            _.isString(_.get(obj, "id"))                                    &&
            _.isString(_.get(obj, "bearer"))                                &&
            _.isDate(_.get(obj, "validity.start"))                          &&
            _.isDate(_.get(obj, "validity.end"))                            &&
            _.isPlainObject(_.get(obj, "tags"))
        );
        if(!format_validity) return null;

        for(let tag_name in obj.tags){
            if(
                !uri.is_valid_pattern(tag_name) ||
                !_.isArray(obj.tags[tag_name]) ||
                !obj.tags[tag_name].every(_.isString)
            ){
                return null;
            }
        }

        const nowtime = new Date().getTime();
        if(!(
            obj.validity.start.getTime() < obj.validity.end.getTime() &&
            obj.validity.start.getTime() < nowtime &&
            nowtime < obj.validity.end.getTime()
        )){
            return null;
        }


        return new OpenPGPCertResult({
            tags: obj.tags,
            bearer_fingerprint: obj.bearer,
            id: obj.id,
        })
    }


}


module.exports = async function (verifying_keys_armored){
    let ks = verifying_keys_armored;
    if(_.isString(ks)){
        ks = await openpgp.readKeys({ armoredKeys: verifying_keys_armored });
    }
    return new OpenPGPCertReader(ks);
}
