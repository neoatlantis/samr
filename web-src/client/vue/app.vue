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



</template>
<script>
import read_upload_file_text from "libs/read_upload_file_text";
import conn from "app/conn";
const _ = require("lodash");


export default {
    data(){ return {
        server_url: "ws://localhost:2222",
        cert: "",
        private_key: "",

    }},

    methods: {
        on_cert_upload(e){
            read_upload_file_text(e.target).then((e)=>this.cert=e);
        },

        on_private_key_upload(e){
            read_upload_file_text(e.target).then((e)=>this.private_key=e);
        },

        connect(){
            conn({
                url: this.server_url,
                cert: this.cert,
                private_key_armored: this.private_key,
            });
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
    }

}
</script>
