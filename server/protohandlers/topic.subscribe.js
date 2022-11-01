const _ = require("lodash");
const { $E, $ERR, $REF, $DEREF } = require("../../protodef");

module.exports = function (socket, request_data){
    let request = $DEREF(request_data);
    let room = request.data();

    if(!_.isString(room)){
        return socket.emit(
            $ERR("error.topic.invalid"),
            $REF(null, request.uuid()).data()
        );
    }

    // Check socket authorization
    if(!socket.usercert.has_tag("subscribe." + room)){
        socket.emit(
            $ERR("error.auth.insufficient"),
            $REF(null, request.uuid()).data()
        );
        return;
    }

    socket.join(room);
    socket.emit(
        $E("topic.subscribed"),
        $REF(room, request.uuid()).data()
    );
};

module.exports.require_session = true;
