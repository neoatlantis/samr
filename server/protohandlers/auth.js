const _ = require("lodash");
const constants = require("../../constants");
const verify_proof = require("../../libs/openpgp-auth/verify_proof");
const session_manager = require("../session");


module.exports = async function(socket, data){
    const now = new Date();

    function reject(reason){
        socket.emit("auth.failure", {
            reason,
        })
    }

    // data is encoded in base64
    let proof = null;
    try{
        proof = Buffer.from(data, "base64");
    } catch(e){
        return reject("Invalid base64-encoded proof data.");
    }

    // verify proof
    let proof_result = await verify_proof(proof, this.authority_public_keys);
    if(_.isNil(proof_result) || !proof_result.is_success()){
        return reject(
            "Proof invalid." +
            (proof_result?
                " Details: " + proof_result.get_error_reason() :
                ""
            )
        );
    }

    // check for given proof

    let claim = proof_result.get_claim();
    let cert  = proof_result.get_cert();

    let claim_conn_id = _.get(claim, "conn", "");
    let claim_session_id = _.get(claim, "session", "");
    let claim_timestamp = _.get(claim, "time", new Date(0));

    // user must claim for the current connection explicitly, otherwise it might
    // be a reused proof

    if(claim_conn_id != socket.id){
        return reject("User must claim for current socket id.");
    }

    // time stamp must be valid

    if(!_.isDate(claim_timestamp)){
        return reject("Invalid timestamp field in user claim.");
    }
    let claim_timestamp_diff = now.getTime() - claim_timestamp.getTime();
    if(Math.abs(claim_timestamp_diff) > constants.TIME_INACCURATITY_TOLERANCE){
        return reject(
            "User claim timestamp not accepted. Check client time setting.")
    }

    // otherwise, we can accept user cert basically

    let userid = cert.get_id();
    socket.usercert = cert;

    // we try to find if user can claim the given session id

    if(!_.isString(claim_session_id)){
        return reject("User claim session invalid.");
    }

    let new_session_id = null;
    if(sessions.reactivate_session(claim_session_id, userid){
        // successfully reactivated session
        new_session_id = claim_session_id;
    } else {
        new_session_id = session_manager.create_session(userid);
    }

    socket.session_id = new_session_id;

    socket.emit("auth.success", {
        session_id: new_session_id,
    })

};
