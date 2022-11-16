<template>

<h3>SAMR client can run both in NodeJS and Browser! </h3>

This is page demonstrates the usage in browser and serves as a generic debugging
tool.

<hr />

<form action="#" @submit="$event.preventDefault()">

<table>
    <tr>
        <td>Server URL</td>
        <td><input type="text" v-model="server_url" /></td>
    </tr>

    <tr>
        <td>Authentication</td>
        <td>
            1. Certificate:
            <input type="file" accept=".asc" @change="on_cert_upload"/>
            2. Private Key (no password):
            <input type="file" accept=".asc" @change="on_private_key_upload"/>
        </td>
    </tr>

    <tr>
        <td colspan="2"><button :disabled="!connectable" @click="connect">Connect</button></td>
    </tr>
</table>


</form>

<hr />

<div style="display:flex">

    <div style="width: 30vw">
        <ConnStatus></ConnStatus>
        <TopicJoinLeave @log="log"></TopicJoinLeave>
        <TopicPublish @log="log"></TopicPublish>
        <TopicCall @log="log"></TopicCall>
    </div>

    <div style="height: 60vh; width: 60vw; background-color: black; overflow-x: hidden; overflow-y: scroll">
        <div style="color:white">
            <div v-for="log in logs.slice().reverse()">
                {{ log }}
            </div>
        </div>
    </div>

</div>

</template>
<script>
import ConnStatus from "sfc/ConnStatus.vue";
import TopicJoinLeave from "sfc/TopicJoinLeave.vue";
import TopicPublish from "sfc/TopicPublish.vue";
import TopicCall from "sfc/TopicCall.vue";

import read_upload_file_text from "libs/read_upload_file_text";
import conn from "app/conn";
const _ = require("lodash");


export default {
    data(){ return {
        server_url: "ws://localhost:2222",
        cert: "",
        private_key: "",

        logs: [],
    }},

    methods: {
        on_cert_upload(e){
            read_upload_file_text(e.target).then((e)=>this.cert=e);
        },

        on_private_key_upload(e){
            read_upload_file_text(e.target).then((e)=>this.private_key=e);
        },

        connect(){
            let client = conn({
                url: this.server_url,
                cert: this.cert,
                private_key_armored: this.private_key,
            });

            client.topics.on("__any__", (e)=>{
                this.logs.push(`Event <${e.topic}>: ${JSON.stringify(e.data)}`);
            })
        },

        log(str){
            this.logs.push(str);
        }
    },

    computed: {
        connectable(){
            return (
                _.includes(
                    this.cert,
                    "-----BEGIN PGP SIGNED MESSAGE-----"
                ) &&
                _.includes(
                    this.private_key,
                    "-----BEGIN PGP PRIVATE KEY BLOCK-----"
                )
            );
        }
    },

    components: {
        ConnStatus,
        TopicJoinLeave,
        TopicPublish,
        TopicCall,

    }

}
</script>
