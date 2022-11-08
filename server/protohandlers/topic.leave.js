const _ = require("lodash");
const { $E, $ERR, $REF, $DEREF } = require("../../protodef");
const uri = require("../../libs/uri");


module.exports = function(socket, data){
    let request = $DEREF(data);
    let { topic } = (request.data() || {});

    if(!uri.is_valid_uri(topic)){
        return socket.emit(
            $ERR("error.topic.invalid"),
            $REF(null, request.uuid()).data()
        );
    }

    socket.auths.delete(topic);
    socket.leave(topic);
    socket.emit(
        $E("topic.left"),
        $REF(topic, request.uuid()).data()
    );
};

module.exports.require_session = true;
