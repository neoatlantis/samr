const _ = require("lodash");
const { $E, $ERR, $REF, $DEREF } = require("../../protodef");


module.exports = async function(socket, request_data){
    let request = $DEREF(request_data);
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

    let authorized = false;
    let room_name = "";
    if(type == "pubsub"){
        authorized = (
            socket.usercert.has_tag("publish." + topic) ||
            socket.usercert.has_tag("subscribe." + topic)
        );
        room_name = "pubsub." + topic;
    }
    if(type == "rpc"){
        authorized = (
            socket.usercert.has_tag("call." + topic) ||
            socket.usercert.has_tag("yield." + topic)
        );
        room_name = "rpc." + topic;
    }

    // Check socket authorization
    if(!authorized){
        return socket.emit(
            $ERR("error.auth.insufficient"),
            $REF(null, request.uuid()).data()
        );
    }

    socket.join(room_name);
    socket.emit(
        $E("topic.joined"),
        $REF(room_name, request.uuid()).data()
    );

};

module.exports.require_session = true;
