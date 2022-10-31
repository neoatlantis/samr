/*
 * Attach and detach a referencing UUID to data, as a standardized method
 * for all RPC style communications.
 *
 * We use special attributes "$r" and "$d" for attaching data. Data to be
 * referenced should not contain these attributes.
 * // TODO make this an error when necessary
 *
 * Usage:
 * 1) reference(data, [uuid]): attach data with a new old existing uuid
 * 2) dereference(input): separate uuid and original data from input
 */
const { v4: uuidv4 }  = require('uuid');
const _ = require("lodash");

function reference(data, use_uuid){
    const this_uuid = use_uuid ? use_uuid : uuidv4();
    return {
        data(){
            return {
                $r: this_uuid,
                $d: data,
            }
        },
        uuid(){
            return this_uuid;
        }
    }
}

function dereference(refdata){
    let this_uuid = _.get(refdata, "$r", null);
    if(!_.isString(this_uuid)) this_uuid = null;
    let this_data = _.isNil(this_uuid) ? refdata : _.get(refdata, "$d", null);

    return {
        data(){ return this_data },
        uuid(){ return this_uuid },
    }
}

module.exports = {
    reference, dereference,
}
