const express = require("express");
const path = require("path");
const _ = require("lodash");


module.exports = function(opts){
    if(false === opts) return;

    // this -> the SAMRClient instance
    const app = express();

    app.use(
        '/',
        express.static(path.join(
            __dirname,
            process.env.SAMR_DEV?'web-dev':'web'
        ))
    );

    app.listen(2244);

}
