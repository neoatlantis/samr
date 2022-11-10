const { info, error, log, $socket } = require("../../libs/logging");
const _ = require("lodash");
const { $E, $ERR, $REF, $DEREF } = require("../../protodef");


function rejoin_rooms(){
    log("Rejoin topics due to rotated session.");
    this.joined_rooms.forEach((room)=>{
        module.exports.join.call(this, room);
    });
}


module.exports.__init__ = function(){
    this.joined_rooms = new Set();
    this.authenticator.on(
        "auth.status.changed",
        ({ authenticated, session_changed })=>{
            // If session changed after new connection, rejoin rooms
            if(authenticated && session_changed){
                rejoin_rooms.call(this);
            }
        }
    );
}


module.exports.join = function(topic){
    if(this.joined_rooms.has(topic)) return;

    let referenced = $REF({ topic });
    let uuid = referenced.uuid();

    let ret = this.new_promise_of_event("topic.joined", uuid);
    this.socket.emit($E("topic.join"), referenced.data());

    log("Trying to join topic: " + topic);
    return ret.then(()=>{
        log("Joined topic: " + topic);
        this.joined_rooms.add(topic);
    }).catch(()=>{
        this.joined_rooms.delete(topic);
    });
}


module.exports.leave = function(topic){
    if(!this.joined_rooms.has(topic)) return;

    let referenced = $REF({ topic });
    let uuid = referenced.uuid();

    let ret = this.new_promise_of_event("topic.left", uuid);
    this.socket.emit($E("topic.leave"), referenced.data());
    return ret.then(()=>{
        this.joined_rooms.delete(topic);
    }).catch(()=>{
        // do nothing
    });
}
