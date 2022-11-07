const _ = require("lodash");
const { $E, $ERR, $REF, $DEREF } = require("../../protodef");


module.exports = function(socket, data){
    let request = $DEREF(data);
    let { topic } = (request.data() || {});

    if( !_.isString(topic) ){
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
