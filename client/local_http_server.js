const express = require("express");
const path = require("path");

module.exports = function(){
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
