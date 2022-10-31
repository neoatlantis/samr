const _ = require("lodash");
const { $E, $ERR, $REF, $DEREF } = require("../../protodef");


module.exports = function(socket, data){
    let request = $DEREF(data);
    let room = request.data();

    if(!_.isString(room)) return socket.emit("error.topic.invalid");
    socket.leave(room);
    socket.emit(
        $E("topic.unsubscribed"),
        $REF(room, request.uuid())
    );
};

module.exports.require_session = true;
