const { v4: uuidv4 } = require('uuid');
const constants = require("../constants");

class Session {

    #id;
    #authorized_userid;
    #last_checkin;
    #store;

    constructor(user_id){
        this.#id = uuidv4();
        this.#authorized_userid = userid;
        this.#store = new Map();
        this.reactivate();
    }

    get_id(){ return this.#id }

    reactivate(){
        this.#last_checkin = new Date().getTime();
    }

    is_expired(){
        return (
            new Date().getTime() - this.#last_checkin >
            constants.SESSION_INACTIVITY_LIFE
        );
    }

    set(key, value){
        this.#store.set(key, value);
        return this;
    }

    get(key){
        return this.#store.get(key);
    }

    delete(key){
        this.#store.delete(key);
        return this;
    }

}
