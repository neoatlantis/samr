const { createClient } = require("redis");
let client = null;


module.exports = function(){
    return client;
}

module.exports.init = async (opts)=>{
    client = createClient(opts);
    await client.connect();
}
