const { $E, $ERR, $REF, $DEREF } = require("../protodef");
const _ = require("lodash");

class OnEventPromiseResolver {

    #hooks;
    constructor(){
        this.#hooks = new Map();
        setInterval(()=>this.clean_up(), 1000);
    }

    set({ event, uuid, resolve, reject, timeout }){
        /* If received event of given type, with referenced uuid matching this
           uuid, call resolve() with payload data. Otherwise, call reject()
           after timeout. In any case, the entry is deleted afterwards. */

        this.#hooks.set(uuid, {
            event, resolve, reject,
            timeout: new Date().getTime() + timeout * 1000,
        });
    }

    handle_error({ event, referenced_data }){
        /* When an error is emitted using event "error.*.*", the promise
           matching given UUID is rejected regardless of their expected event
           name.

           For example: user emits "topic.publish", expecting "topic.published",
           but instead of that result, server emits "error.auth.insufficient"
           as the user has not obtained that authorization.
         */
        let error_packet = $DEREF(referenced_data);
        let uuid = error_packet.uuid();
        let data = error_packet.data();

        let record = this.#hooks.get(uuid);
        if(_.isNil(record)) return;

        if(_.isFunction(record.reject)){
            // Throw an Error with message set to data (reason), and name to
            // error event URI (e.g. error.auth.insufficient)
            let constructed_error = new Error(data);
            constructed_error.name = event;
            record.reject(constructed_error);
        }
        this.#hooks.delete(uuid);
    }

    handle({ event, referenced_data }){
        let request = $DEREF(referenced_data);
        let uuid = request.uuid();

        let record = this.#hooks.get(uuid);
        if(_.isNil(record)) return;

        if(record.event != event) return; // event type must match

        if(_.isFunction(record.resolve)){
            record.resolve(request.data());
        }
        this.#hooks.delete(uuid);
    }

    clean_up(){
        const now = new Date().getTime();
        let deleting = [];
        this.#hooks.forEach(({ reject, timeout }, uuid)=>{
            if(timeout < now){
                if(_.isFunction(reject)){
                    let constructed_error = new Error(
                        `Call <${uuid}> timed out.`);
                    constructed_error.name = $ERR("error.timeout");
                    reject(constructed_error);
                }
                deleting.push(uuid);
            }
        });
        deleting.forEach((uuid)=>{
            this.#hooks.delete(uuid);
        });
    }

}

module.exports = OnEventPromiseResolver;
