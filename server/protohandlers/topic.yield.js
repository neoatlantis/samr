const _ = require("lodash");
const rpc_router_table = require("../rpc_router_table");
const { $E, $ERR, $REF, $DEREF } = require("../../protodef");
const uri = require("../../libs/uri");


module.exports = async function(socket, request_data){
    let request = $DEREF(request_data);
    let { topic, result, error } = (request.data() || {});

    if(!uri.is_valid_uri(topic)){
        return socket.emit(
            $ERR("error.topic.invalid"),
            $REF(null, request.uuid()).data()
        );
    }

    // Check socket authorization
    if(!(
        socket.rooms.has(topic) &&
        socket.auths.has(topic, "yield")
    )){
        socket.emit(
            $ERR("error.auth.insufficient"),
            $REF(null, request.uuid()).data()
        );
        return;
    }

    // invocation id, the client must retain the id sent during topic.call
    let invocation_id = request.uuid();
    let invocation_record = rpc_router_table.get_record({ uuid: invocation_id});
    if(!invocation_record){
        rpc_router_table.delete_record({ uuid: invocation_id });
        // Nothing really to do.
        return;
    }
    let { sender, receiver } = invocation_record;
    if(receiver != socket.session_id){
        // Unauthorized answer
        return;
    }

    // sent back data to caller
    let sender_socket = _.find(
        await this.io.in(topic).fetchSockets(),
        (s)=>s.session_id && s.session_id == sender
    );
    // TODO if no sender live connection, queue the answer?
    if(!sender_socket){
        return; // drop the message
    }

    // Return information to sender socket.
    sender_socket.emit(
        $E("topic.result"),
        $REF({ topic, result, error }, invocation_id).data()
    )

    // remove old record
    rpc_router_table.delete_record({ uuid: invocation_id });
};

module.exports.require_session = true;
