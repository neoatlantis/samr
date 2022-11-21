const get_client = require("./client");

module.exports.init = async (options) => {
    /* Initialize redis */
    await get_client.init(options);
    console.log("Redis connected.");
}

module.exports.client = get_client;
