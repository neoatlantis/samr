const _ = require("lodash");


module.exports = async function(socket, room, data){
    if(!_.isString(room)) return socket.emit("error.topic.invalid");
    // TODO check socket authentication
    if(_.get(data, "type") != "event"){
        return;
    }
    let uuid = _.get(data, "uuid");
    let realdata = _.get(data, "data");
    let sockets = await this.io.in(room).fetchSockets();
    sockets.forEach((s)=>s.emit("topic.event", room, realdata));
    socket.emit("topic.published", uuid);
};
