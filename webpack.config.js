
module.exports = (env)=>{

    const is_dev = (env.production === undefined);

    return [
        require("./webpack/client.js")({ env, is_dev }),
        require("./webpack/server.js")({ env, is_dev }),
    ];

};
