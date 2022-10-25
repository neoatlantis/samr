const openpgp = require("openpgp");
const crypto = require("crypto");
const _ = require("lodash");
const yaml = require("js-yaml");


class OpenPGPCertResult {

    #tags;
    #bearer_fingerprint;
    #id;

    constructor({ tags, bearer_fingerprint, id }){
        this.#tags = Array.from(new Set(tags)).map(this.#normalize_tag);
        this.#bearer_fingerprint = bearer_fingerprint;
        this.#id = id;
    }

    #normalize_tag(t){
        if(_.endsWith(t, ".")) return t;
        return t + ".";
    }

    #display_tag(t){
        return _.trim(t, ".");
    }

    get_bearer_fingerprint(){ return this.#bearer_fingerprint; }
    get_id(){ return this.#id }

    has_tag(t){
        return _.includes(this.#tags, this.#normalize_tag(t));
    }

    get_tags_prefixed_with(t){
        if(!_.endsWith(t, ".")) t += ".";
        return _.filter(this.#tags, (i)=>_.startsWith(i, t))
            .map(this.#display_tag);
    }

    get_tags_suffixed_with(t){
        if(!_.startsWith(t, ".")) t = "." + t;
        return _.filter(this.#tags, (i)=>_.endsWith(i, t))
            .map(this.#display_tag);
    }

    get_tags_with_wildcard(t){
        let sp = t.split("*");
        if(sp.length != 2) return [];
        return _.intersection(
            this.get_tags_prefixed_with(sp[0]),
            this.get_tags_suffixed_with(sp[1])
        ).map(this.#display_tag);
    }



}





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
            _.isArray(_.get(obj, "tags"))                                   &&
            _.get(obj, "tags").every(_.isString)
        );
        if(!format_validity) return null;

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
    let ks = await openpgp.readKeys({ armoredKeys: verifying_keys_armored });
    return new OpenPGPCertReader(ks);
}
