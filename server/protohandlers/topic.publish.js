const _ = require("lodash");
const { $E, $ERR, $REF, $DEREF } = require("../../protodef");


module.exports = async function(socket, request_data){
    let request = $DEREF(request_data);
    let { topic, data } = (request.data() || {});

    if(!_.isString(topic)){
        return socket.emit(
            $ERR("error.topic.invalid"),
            $REF(null, request.uuid()).data()
        );
    }

    let room = "pubsub." + topic;

    // Check socket authorization
    if(!(
        socket.rooms.has(room) &&
        socket.usercert.has_tag("publish." + topic)
    )){
        socket.emit(
            $ERR("error.auth.insufficient"),
            $REF(null, request.uuid()).data()
        );
        return;
    }

    // Return (will be) published event

    socket.emit(
        $E("topic.published"),
        $REF(null,request.uuid()).data()
    );

    // Broadcast events

    socket.to(room).emit(
        $E("topic.event"),
        $REF({ topic, data }).data()
    );

};

module.exports.require_session = true;
