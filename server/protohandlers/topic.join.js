const { info, error, log, $socket } = require("../../libs/logging");

const _ = require("lodash");
const { $E, $ERR, $REF, $DEREF } = require("../../protodef");
const uri = require("../../libs/uri");


module.exports = async function(socket, request_data){
    let request = $DEREF(request_data);
    let { topic } = (request.data() || {});

    if(!uri.is_valid_uri(topic)){
        return socket.emit(
            $ERR("error.topic.invalid"),
            $REF(null, request.uuid()).data()
        );
    }

    if(!socket.usercert.has_tag(topic)){
        return socket.emit(
            $ERR("error.auth.insufficient"),
            $REF(
                "User cert does not authorize joining topic: " + topic,
                request.uuid()
            ).data()
        );
    }

    let attrs = socket.usercert.get_tag_attrs(topic);

    socket.join(topic);
    socket.auths.set(topic, attrs);

    socket.emit($E("topic.joined"), $REF(topic, request.uuid()).data());

    log(`${$socket(socket)} joined topic: ${topic}, with attributes: ${attrs.join(",")}`);
};

module.exports.require_session = true;
