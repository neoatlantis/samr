const _ = require("lodash");

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

module.exports = OpenPGPCertResult;