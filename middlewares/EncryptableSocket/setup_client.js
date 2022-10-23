/*
Modified code from "socket.io-encrypt".
*/

const _ = require("lodash");
const reserved_events = require("./reserved-events");
const { on, off, emit, removeEventListener, removeListener, security_context }
    = require('./symbol');
const ClientSecurityContext = require("./ClientSecurityContext");



module.exports = (socket) => {
    let sc = new ClientSecurityContext();
    socket[security_context] = sc;

    socket[emit] = socket.emit;
    socket[on] = socket.on;
    socket[off] = socket.off;
    socket[removeEventListener] = socket.removeEventListener;
    socket[removeListener] = socket.removeListener;

    socket.emit = (event, ...args) => {
        if(_.includes(reserved_events, event)){
            return socket[emit](event, ...args);
        }
        sc.handle_outgoing(event, ...args);
    };

    sc.on("secure.start", (e)=>socket.emit("secure.start", e));
    sc.on("secure.data", (e)=>socket.emit("secure.data", e));



    socket.on = (event, handler) => {
        if(_.includes(reserved_events, event)){
            return socket[on](event, handler);
        }
        return sc.on(event, handler);
    };

    socket.off = (event, handler) => {
        if(_.includes(reserved_events, event)){
            return socket[off](event, handler);
        }
        return sc.off(event, handler);
    }

    socket.removeEventListener = (event, handler) => {
        return socket.off(event, handler);
    }

    socket.removeListener = (event, handler) => {
        return socket.off(event, handler);
    }

    // Actively start encryption on connection or reconnection.
    socket.on("connect", ()=>sc.start_encryption());

    socket.on(
        'secure.data', (args)=>sc.handle_incoming("secure.data", args));
    socket.on(
        'secure.start', (args)=>sc.handle_incoming("secure.start", args));


    return socket;
};
