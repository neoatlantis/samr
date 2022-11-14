/// #if DEV
const { SAMRClient } = require("client-browser/SAMRClientBrowser.dev.js");
/// #else
const { SAMRClient } = require("client-browser/SAMRClientBrowser.js");
/// #endif

/*
const client = new SAMRClient({
    url: "ws://localhost:2222",
});
*/

import { createApp } from "vue";
import App from "sfc/app.vue";

const app = createApp(App).mount("#app");
