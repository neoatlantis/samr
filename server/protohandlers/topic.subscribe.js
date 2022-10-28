const _ = require("lodash");

module.exports = function (socket, room){
    if(!_.isString(room)) return socket.emit("error.topic.invalid");
    // TODO authenticate socket
    socket.join(room);
    socket.emit("topic.subscribed", room);
};
