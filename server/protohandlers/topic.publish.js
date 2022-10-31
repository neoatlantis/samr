const _ = require("lodash");
const { $E, $ERR } = require("../../protodef");


module.exports = async function(socket, room, data){
    if(!_.isString(room)) return socket.emit("error.topic.invalid");
    // TODO check socket authentication
    if(_.get(data, "type") != "event"){
        return;
    }
    let ref = _.get(data, "$ref");
    let realdata = _.get(data, "data");
    let sockets = await this.io.in(room).fetchSockets();
    sockets.forEach((s)=>s.emit($E("topic.event"), room, realdata));
    socket.emit($E("topic.published"), uuid);
};
