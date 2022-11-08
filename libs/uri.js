const _ = require("lodash");

class URIRule {

    #lookup_buffer;

    constructor(){
        this.#lookup_buffer =
            Array(129).fill(null).map(()=>new Uint8Array(129));
    }

    normalize(t){
        t = t.trim().toLowerCase();
        if(t.slice(-1) == "."){
            t = t.slice(0, -1);
        }
        if(t.length > 255) throw Error("URI too long.");
        return t;
    }

    is_valid_uri(name){
        if(!_.isString(name)) return false;
        try{
            return this.normalize(name).split(".").every((e)=>
                /^[0-9a-z\-]{1,63}$/.test(e) &&
                e[0] != "-" &&
                e[e.length-1] != "-"
            );
        } catch(e){
            return false;
        }
    }

    is_valid_pattern(pattern){
        if(!_.isString(pattern)) return false;
        try{
            return this.normalize(pattern).split(".").every((e)=>
                /^(\*|\*\*|[0-9a-z\-]{1,63})$/.test(e) &&
                e[0] != "-" &&
                e[e.length-1] != "-"
            );
        } catch(e){
            return false;
        }
    }

    match(pattern, strr){
        pattern = this.normalize(pattern);
        strr = this.normalize(strr);

        if(!this.is_valid_pattern(pattern) || !this.is_valid_uri(strr)){
            throw Error("Invalid arguments.");
        }
        pattern = pattern.split(".");
        strr = strr.split(".");

        let n = strr.length, m = pattern.length;

        // empty pattern can only match with empty string
        if (m == 0) return (n == 0);

        // lookup table for storing results of subproblems
        let lookup = this.#lookup_buffer;

        // empty pattern can match with empty string
        lookup[0][0] = 1;

        // Only '*' can match with empty string
        for(let j=1; j<m+1; j++){
            if (pattern[j - 1] == '**'){
                lookup[0][j] = lookup[0][j - 1];
            }
        }

        // fill the table in bottom-up fashion
        for(let i=1; i<n+1; i++){
            for(let j=1; j<m + 1; j++){
                if(pattern[j - 1] == '**'){
                    /*Two cases if we see a '*'
                      a) We ignore ‘*’ character and move
                      to next character in the pattern,
                      i.e., ‘*’ indicates an empty sequence.
                      b) '*' character matches with ith
                      character in input
                    */
                    lookup[i][j] = lookup[i][j - 1] || lookup[i - 1][j];
                } else if (pattern[j - 1] == '*' || strr[i - 1] == pattern[j - 1]){
                    /*Current characters are considered as
                      matching in two cases
                      (a) current character of pattern is '?'
                      (b) characters actually match
                    */
                    lookup[i][j] = lookup[i - 1][j - 1];
                } else {
                    // If characters don't match
                    lookup[i][j] = 0;
                }
            }
        }
        return Boolean(lookup[n][m]);

    }

}

module.exports = new URIRule();
