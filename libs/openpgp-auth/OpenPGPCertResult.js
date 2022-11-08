const _ = require("lodash");
const uri = require("../uri");

class OpenPGPCertResult {

    #tags;
    #bearer_fingerprint;
    #id;

    constructor({ tags, bearer_fingerprint, id }){
        this.#tags = new Map();
        for(let tag_name in tags){
            this.#tags.set(tag_name, tags[tag_name]);
        }

        this.#bearer_fingerprint = bearer_fingerprint;
        this.#id = id;
    }

    normalize_tag(t){
        return uri.normalize(t);
    }

    get_bearer_fingerprint(){ return this.#bearer_fingerprint; }
    get_id(){ return this.#id }

    get_matching_tag(t){
        for(let [tag_pattern] of this.#tags){
            if(uri.match(tag_pattern, t)){
                return tag_pattern;
            }
        }
        return null;
    }

    has_tag(t, attr){
        let matching_tag = this.get_matching_tag(t);
        if(_.isNil(attr)){
            return matching_tag;
        } else {
            return _.includes(this.#tags.get(matching_tag), attr);
        }
    }

    get_tag_attrs(t){
        let matching_tag = this.get_matching_tag(t);
        return this.#tags.get(matching_tag) || [];
    }


}

module.exports = OpenPGPCertResult;
