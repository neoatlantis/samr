const _ = require("lodash");

class SocketAuthorizationHolder{
    #data;
    constructor(){
        this.#data = new Map();
    }

    delete(room){
        this.#data.delete(room);
    }

    set(room, tags){
        this.#data.set(room, tags);
    }

    get(room){
        return this.#data.get(room) || [];
    }

    has(room, tag){
        return _.includes(this.get(room), tag);
    }
}

module.exports = SocketAuthorizationHolder;
