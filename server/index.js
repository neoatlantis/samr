const _ = require("lodash");
const SAMRServer = require("./SAMRServer");
const { Server: SocketIOServer } = require("socket.io");

function initialize({
    io=null,
    port=2222,
    private_key='',
}){
    if(_.isNil(io)){
        io = new SocketIOServer();
        io.listen(port);
        console.debug("SAMR server running at port:" + port);
    }
    return new SAMRServer({
        io, private_key,
    });
}


module.exports = {
    initialize
}
