const log = require("fancy-log");
const { info, error, warn, dir } = log;

function $socket(socket){
    return `Socket<${socket.id}${socket.session_id?', '+socket.session_id:''}>`;
}

module.exports = {
    info, error, warn, dir, log,
    $socket,
}
