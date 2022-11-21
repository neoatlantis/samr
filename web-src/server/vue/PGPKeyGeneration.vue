<template>
<div>

Generate a pair of OpenPGP keys. You may use this key for general purpose.
For SAMR system, the server should have at least one authority PGP public key,
which is also used to issue certificates for incoming users.

<p />

<form action="#" @submit="generate" v-if="!result_privatekey">
<table>
    <tr>
        <td>Username</td>
        <td><input type="text" v-model="username" required/></td>
    </tr>
    <tr>
        <td>Email</td>
        <td><input type="email" v-model="email"/></td>
    </tr>
    <tr>
        <td>Usage</td>
        <td>
            <input type="radio" id="pgp-usage-server" v-model="usage" value="server" name="pgp-usage">
            <label for="pgp-usage-server">Authority key</label>
            <input type="radio" id="pgp-usage-client" v-model="usage" value="client" name="pgp-usage">
            <label for="pgp-usage-client">Client login key</label>
        </td>
        <td></td>
    </tr>

    <template v-if="usage=='server'">
        <tr>
            <td>Password</td>
            <td><input type="password" v-model="password"/></td>
            <td>Choose a strong password, at least 5 chars.</td>
        </tr>
        <tr>
            <td>Type password again</td>
            <td><input type="password" v-model="password2"/></td>
            <td><span v-if="password2!=password" style="color:red">Passwords not match.</span></td>
        </tr>
    </template>

    <tr>
        <td colspan="2"><button type="submit" :disabled="!may_generate">Generate</button></td>
    </tr>
</table>
</form>

<div v-if="result_error" style="color:red">
    <h3>OpenPGP returned following error:</h3>
    {{ result_error }}
</div>

<div id="result" v-if="result_privatekey">

    <h3>A new pair of keys were generated successfully.</h3>

    <div>
        First, this is your <strong>important</strong> private key.
        Please keep this key in your computer and have a backup.
        If lost, you cannot use this key again.
    </div>

    <div>
        <textarea readonly v-model="result_privatekey" style="color:#EE0000; background-color: #FFEEEE"></textarea>
        <br />
        <button @click="download_privatekey">Download this key</button>
    </div>

    <div v-if="!result_privatekey_saved">
        <input
            v-model="result_privatekey_saved"
            v-bind:disabled="!result_privatekey_downloaded"
            type="checkbox" id="private-key-saved" />
        <label for="private-key-saved">I confirm having downloaded the above private key to my disk.</label>
    </div>
    <p />

    <template v-if="result_privatekey_saved">
        <div>
            Following public key is needed to configure your server.
            <br />
            <textarea readonly v-model="result_publickey"></textarea>
            <br />
            <button @click="download_publickey">Download this key</button>
        </div>
    </template>

    <p />
    <button @click="clear_up">Reset</button>

</div>


</div>
</template>
<script>

import * as openpgp from "openpgp";


function download_text(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}





export default {

    data(){ return {
        username: "",
        email: "",
        password: "",
        password2: "",

        /// #if DEV
        username: "test user",
        email: "test@example.com",
        password: "password",
        password2: "password",
        /// #endif

        usage: "server",

        result_usage: "",
        result_privatekey: "",
        result_privatekey_downloaded: false,
        result_privatekey_saved: false,
        result_publickey: "",
        result_error: "",

        generating: false,
    }},

    computed: {

        may_generate(){
            return (
                !this.generating &&
                this.username != "" &&
                (
                    this.usage=="client" ||
                    (this.usage == "server" && (
                        this.password != "" && this.password.length > 5 &&
                        this.password2 == this.password
                    ))
                )
            );
        }

    },

    methods: {

        clear_up(){
            this.result_publickey = this.result_privatekey = "";
            this.result_error = "";
            this.result_privatekey_downloaded = false;
            this.result_privatekey_saved = false;
        },

        download_privatekey(){
            let fn = (
                "server" == this.result_usage ?
                "samr-authority-private-key-DO-NOT-SHARE.asc" :
                "samr-client-private-key.asc"
            );
            download_text(fn, this.result_privatekey);
            this.result_privatekey_downloaded = true;
        },

        download_publickey(){
            let fn = (
                "server" == this.result_usage ?
                "samr-authority-public-key.asc" :
                "samr-client-public-key.asc"
            );
            download_text(fn, this.result_publickey);
        },

        async generate(e){
            this.generating = true;
            e.preventDefault();

            try{
                let { privateKey, publicKey } = await openpgp.generateKey({
                    type: "ecc",
                    curve: "curve25519",
                    userIDs: [{
                        name: this.username,
                        email: this.email,
                    }],
                    passphrase: this.usage == "server" ? this.password : "",
                    format: "armored"
                });

                this.result_publickey = publicKey;
                this.result_privatekey = privateKey;
            } catch(e){
                this.result_publickey = this.result_privatekey = "";
                this.result_error = e.message;
            } finally {
                this.result_privatekey_downloaded = false;
                this.result_privatekey_saved = false;
                this.result_usage = this.usage;
                this.generating = false;
            }
        }

    }



}



</script>
