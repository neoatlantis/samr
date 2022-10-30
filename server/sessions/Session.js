const { v4: uuidv4 } = require('uuid');
const constants = require("../constants");
const _ = require("lodash");

class Session {

    #id;
    #authorized_userid;
    #last_checkin;
    #store;

    constructor(user_id){
        if(!_.isString(user_id)){
            throw Error("Session must be created with user_id string.");
        }

        this.#id = uuidv4();
        this.#authorized_userid = user_id;
        this.#store = new Map();
        this.reactivate();
    }

    get_id(){ return this.#id }

    reactivate(check_user_id){
        if(check_user_id != this.#authorized_userid) return false;
        this.#last_checkin = new Date().getTime();
        return true;
    }

    get_userid(){
        return this.#authorized_userid;
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

module.exports = Session;
