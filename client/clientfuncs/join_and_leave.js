const _ = require("lodash");
const { $E, $ERR, $REF, $DEREF } = require("../../protodef");


module.exports.join = function(topic){
    let referenced = $REF({ topic });
    let uuid = referenced.uuid();

    let ret = this.new_promise_of_event("topic.joined", uuid);
    this.socket.emit($E("topic.join"), referenced.data());
    return ret.then(()=>{
        this.joined_rooms.add(topic);
    });
}


module.exports.leave = function(topic){
    let referenced = $REF({ topic });
    let uuid = referenced.uuid();

    let ret = this.new_promise_of_event("topic.left", uuid);
    this.socket.emit($E("topic.leave"), referenced.data());
    return ret.then(()=>{
        this.joined_rooms.delete(topic);
    });
}
