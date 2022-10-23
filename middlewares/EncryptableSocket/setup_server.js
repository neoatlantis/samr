/*
A middle ware for requiring inband socket io encryption.
*/

const _ = require("lodash");
const { emit, security_context } = require("./symbol");
const reserved_events = require("./reserved-events");
const ServerSecurityContext = require("./ServerSecurityContext");
const openpgp = require("openpgp");

const per_socket_middleware_factory = (sc)=> async (args, next)=>{
    try{
        await sc.handle_incoming(args)
        next();
    } catch(e){
        next(e);
    }
}



module.exports = async (private_key)=>{
    const pgp_private_key = await openpgp.readKey({
        armoredKey: private_key,
    });

    if(!pgp_private_key.isPrivate()){
        console.error("fatal.secure.invalid-private-key");
        throw Error("fatal.secure.invalid-private-key");
    }

    const pgp_public_key_binary = pgp_private_key.toPublic().write();

    return (socket, next)=>{
        // Middleware for Socket.IO
        // Function:
        //  1. for each new socket, bind SecurityContext to it, and passes
        //     events generated from SecurityContext to Socket.
        //  2. attach per socket message middleware to that socket.
        if(_.isNil(_.get(socket, security_context))){
            let sc = new ServerSecurityContext(
                pgp_private_key,
                pgp_public_key_binary
            );
            socket[security_context] = sc;

            socket[emit] = socket.emit;

            // intercept outgoing events by replacing socket.emit function
            socket.emit = (event, ...args) => {
                if(_.includes(reserved_events, event)){
                    return socket[emit](event, ...args);
                }
                sc.handle_outgoing(event, ...args);
            }

            // intercept incoming messages by passed through a per-socket
            // middleware
            socket.use(per_socket_middleware_factory(sc));

            // otherwise, transfer events emitted by ServerSecurityContext
            sc.on("secure.start", (arg)=>{
                socket.emit("secure.start", arg);
            });
            sc.on("secure.data", (arg)=>{
                socket.emit("secure.data", arg);
            });
        }
        if(next) next();
    }

}
