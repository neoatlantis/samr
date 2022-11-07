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

    // Check socket authorization
    if(!(
        socket.rooms.has(topic) &&
        socket.auths.has(topic, "publish")
    )){
        socket.emit(
            $ERR("error.auth.insufficient"),
            $REF(
                "User cert does not authorize publishing to topic: " + topic,
                request.uuid()
            ).data()
        );
        return;
    }

    // Return (will be) published event

    socket.emit(
        $E("topic.published"),
        $REF(null, request.uuid()).data()
    );

    // Broadcast events

    socket.to(topic).emit(
        $E("topic.event"),
        $REF({ topic, data }).data()
    );

};

module.exports.require_session = true;
