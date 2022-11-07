const _ = require("lodash");
const crypto = require("crypto");
const { $E, $ERR, $REF, $DEREF } = require("../../protodef");

const constants = require("../constants");



module.exports = async function(socket, orig_data){
    let request = $DEREF(orig_data);

    if(!socket._auth_challenge){
        socket._auth_challenge = Buffer.alloc(16);
    }

    await new Promise(function(resolve, reject) {
        crypto.randomFill(socket._auth_challenge, (err, result)=>{
            resolve();
        });
    });


    socket.emit(
        $E("auth.challenge"),
        $REF(
            { challenge: socket._auth_challenge.toString("hex") },
            request.uuid()
        ).data()
    );
}
