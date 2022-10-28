const _ = require("lodash");


module.exports = function(socket, room){
    if(!_.isString(room)) return socket.emit("error.topic.invalid");
    socket.leave(room);
    socket.emit("topic.unsubscribed", room);
};
