const _ = require("lodash");
const rpc_router_table = require("../rpc_router_table");
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
        socket.auths.has(topic, "call")
    )){
        socket.emit(
            $ERR("error.auth.insufficient"),
            $REF(null, request.uuid()).data()
        );
        return;
    }

    // Find out which socket may handle the call request

    let sockets_in_room = _.filter(
        this.io.in(room).fetchSockets(),
        (s)=>(
            s.session_id &&
            s.auths.has_tag(topic, "yield")
        )
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

    // Create new invocation

    let invocation = $REF({ data });
    let invocation_id = invocation.uuid();
    rpc_router_table.add_record({
        uuid: invocation_id,
        sender:   socket.session_id,
        receiver: choosen_socket.session_id,
    });

    choosen_socket.emit(
        $E("topic.invoke"),
        new_event.data()
    );

    socket.emit(
        $E("topic.called"),
        $REF(invocation_id, request.uuid()).data()
    )
};

module.exports.require_session = true;
