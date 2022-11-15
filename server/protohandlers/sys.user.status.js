const _ = require("lodash");
const rpc_router_table = require("../rpc_router_table");
const { $E, $ERR, $REF, $DEREF } = require("../../protodef");
const uri = require("../../libs/uri");


module.exports = async function(socket){

    socket.emit($E("sys.user.status"), $REF({
        time: new Date(),
        session_id: _.get(socket, "session_id", null),

    }).data());


}
