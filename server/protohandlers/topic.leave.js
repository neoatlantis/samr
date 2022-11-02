const _ = require("lodash");
const { $E, $ERR, $REF, $DEREF } = require("../../protodef");


module.exports = function(socket, data){
    let request = $DEREF(data);
    let { topic, type } = (request.data() || {});

    if(
        !_.isString(topic) ||
        (type != "pubsub" && type != "rpc")
    ){
        return socket.emit(
            $ERR("error.topic.invalid"),
            $REF(null, request.uuid()).data()
        );
    }

    let room = type + "." + topic;
    socket.leave(room);
    socket.emit(
        $E("topic.left"),
        $REF(room, request.uuid()).data()
    );
};

module.exports.require_session = true;
