const crypto = require("crypto");
const msgpack = require("msgpack-lite");
const _ = require("lodash");
const reserved_events = require("./reserved-events");


const CIPHER = "chacha20-poly1305";


class Counter {
    #counter;
    constructor(){
        this.#counter = new Uint32Array(2);
    }

    get(){
        this.#counter[0] += 1;
        if(this.#counter[0] == 0){
            this.#counter[1]++;
            if(this.#counter[1] == 0){
                throw Error("Counter overflow");
            }
        }
        return new Uint8Array(this.#counter.buffer).slice(0, 12);
    }

    increase_to(u8array){
        // Compare another IV to see if its smaller than current counter value,
        // being then a previous value.
        if(!_.isTypedArray(u8array)) return false;
        if(u8array.length != 8) return false;
        let u32array = new Uint32Array(u8array.buffer);
        if(
            u32array[1] >= this.#counter[1] &&
            u32array[0] > this.#counter[0]
        ){
            this.#counter.set(u32array, 0);
            return true;
        }
        return false;
    }
}



class SymmetricCipher {

    #s2c_key;
    #c2s_key;
    #s2c_counter;
    #c2s_counter;

    #derive_key(key){
        function keygen(tag, msg){
            let h = crypto.createHmac('sha256', tag);
            h.update(msg);
            return h.digest();
        }

        this.#s2c_key = keygen('s2c', key);
        this.#c2s_key = keygen('c2s', key);
    }

    constructor(key){
        this.#derive_key(key);
        this.#s2c_counter = new Counter();
        this.#c2s_counter = new Counter();
    }

    #create_cipher(key, iv){
        return crypto.createCipheriv(CIPHER, key, iv, { authTagLength: 16 });
    }

    #create_decipher(key, iv){
        return crypto.createDecipheriv(CIPHER, key, iv, { authTagLength: 16 });
    }

    async #get_nonce(){
        return await new Promise((resolve, reject)=>{
            crypto.randomBytes(12, (err, buf)=>{
                if(err) return reject(err);
                resolve(buf);
            });
        });
    }

    async #encrypt(key, counter, obj){
        let nonce = await this.#get_nonce();
        let cipher = this.#create_cipher(key, nonce);
        let counter_v = counter.get();

        let ciphertext = cipher.update(msgpack.encode([
            counter_v,
            obj
        ]));
        ciphertext = Buffer.concat([ciphertext, cipher.final()]);
        let auth_tag = cipher.getAuthTag();
        return Buffer.from(
            msgpack.encode([ nonce, auth_tag, ciphertext ])
        ).toString("base64");
    }

    async #decrypt(key, counter, data){
        let decrypted = null;
        try{
            let [ nonce, auth_tag, ciphertext ] = msgpack.decode(
                Buffer.from(data, "base64")
            );
            let decipher = this.#create_decipher(key, nonce);
            decipher.setAuthTag(auth_tag);
            decrypted = decipher.update(ciphertext);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            decrypted = msgpack.decode(decrypted);
        } catch(e){
            console.error("Decrypt error", e);
            return null;
        }

        // verify counter value to prevent replay
        if(!counter.increase_to(decrypted[0])) return null;

        // data to be emitted, check for safety rules
        let payload = _.get(decrypted, 1);
        if(!_.isArray(payload)) return null;
        let event_name = _.get(payload, 0);
        if(!_.isString(event_name)) return null;
        if(_.includes(reserved_events, event_name)) return null;
        return payload;
    }

    encrypt_s2c(obj){
        return this.#encrypt(this.#s2c_key, this.#s2c_counter, obj);
    }

    decrypt_s2c(ciphertext){
        return this.#decrypt(this.#s2c_key, this.#s2c_counter, ciphertext);
    }

    encrypt_c2s(obj){
        return this.#encrypt(this.#c2s_key, this.#c2s_counter, obj);
    }

    decrypt_c2s(ciphertext){
        return this.#decrypt(this.#c2s_key, this.#c2s_counter, ciphertext);
    }

}

module.exports = SymmetricCipher;
