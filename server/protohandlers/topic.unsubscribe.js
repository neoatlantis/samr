const _ = require("lodash");
const { $E, $ERR, $REF, $DEREF } = require("../../protodef");


module.exports = function(socket, room){
    if(!_.isString(room)) return socket.emit("error.topic.invalid");
    socket.leave(room);
    socket.emit($E("topic.unsubscribed"), room);
};
