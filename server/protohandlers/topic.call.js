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

    let room = "rpc." + topic;

    // Check socket authorization
    if(!(
        socket.rooms.has(room) &&
        socket.usercert.has_tag("call." + topic)
    )){
        socket.emit(
            $ERR("error.auth.insufficient"),
            $REF(null, request.uuid()).data()
        );
        return;
    }

    // Find out which socket may handle the call request

    let answerer_tag = "answer." + topic;
    let sockets_in_room = _.filter(
        this.io.in(room).fetchSockets(),
        (s)=>s.session_id && s.usercert && s.usercert.has_tag("answer." + topic)
    );

    if(sockets_in_room.length < 1){
        return socket.emit(
            $ERR("error.rpc.no-answer"),
            $REF(null, request.uuid()).data()
        );
    }

    // pick a socket for answer
    // TODO multiple algorithms possible
    let choosen_socket = sockets_in_room[
        Math.floor(Math.random(0, sockets_in_room.length))
    ];

    let invocation_id = request.uuid();

    // TODO add (caller session_id, callee session id, invocation_id) to
    // rpc router table

    choosen_socket.emit(
        $E("topic.invoke"),
        $REF({ data }, invocation_id).data()
    );
};

module.exports.require_session = true;
