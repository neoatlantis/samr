const events = require("./events");
const errors = require("./errors");
const _ = require("lodash");
const { reference, dereference }  =require("./referencing");

function check(source, i){
    if(_.includes(source, i)) return i;
    throw Error("Undefined event or error: " + i);
}

module.exports = {
    $E: (i)=>check(events, i),
    $ERR: (i)=>check(errors, i),

    $REF: reference,
    $DEREF: dereference,
}
