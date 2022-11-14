
module.exports = (env)=>{

    const is_dev = (env.production === undefined);

    return [
        require("./webpack/client-browser.js")({ env, is_dev }),

        require("./webpack/client-webtool.js")({ env, is_dev }),
        require("./webpack/server-webtool.js")({ env, is_dev }),
    ];

};
