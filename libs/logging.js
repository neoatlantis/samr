let _console = null;
let log = null;
/// #if BROWSER
_console = console;
log = console.log;
/// #else
_console = require("fancy-log");
log = _console;
/// #endif
const { info, error, warn, dir } = _console;

function $socket(socket){
    return `Socket<${socket.id}${socket.session_id?', '+socket.session_id:''}>`;
}

module.exports = {
    info, error, warn, dir, log,
    $socket,
}
