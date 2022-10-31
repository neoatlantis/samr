const _ = require("lodash");
const { $E, $ERR, $REF, $DEREF } = require("../../protodef");


module.exports = async function(socket, request_data){
    let request = $DEREF(request_data);
    let { topic, data } = request.data();

    if(!_.isString(topic)) return socket.emit("error.topic.invalid");

    // Check authentication. Just see if socket is joined in that room.
    // Other checks will be performed when socket call topic.subscribe.

    // TODO should not use subscribe, but another method, to distinguish
    // the socket's read(subscribe) and write(publish) rights.

    if(!_.includes(socket.rooms, topic)){
        // socket not in given topic room.
        socket.emit(
            $ERR("error.topic.not-subscribed"),
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

    this.io.in(room).emit(
        $E("topic.event"),
        $REF({ topic, data })
    );

};

module.exports.require_session = true;
