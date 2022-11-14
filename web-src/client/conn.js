/// #if DEV
const { SAMRClient } = require("client-browser/SAMRClientBrowser.dev.js");
/// #else
const { SAMRClient } = require("client-browser/SAMRClientBrowser.js");
/// #endif

let client = null;
export default function init(params){
    if(null != client) return client;
    client = new SAMRClient(params);
    return client;
}
