<template>
<div>

Generate a pair of OpenPGP keys. You may use this key for general purpose.
For SAMR system, the server should have at least one authority PGP public key,
which is also used to issue certificates for incoming users.

<p />

<form action="#" @submit="generate">
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
        <td>Password</td>
        <td><input type="password" v-model="password"/></td>
        <td>Choose a strong password, at least 5 chars.</td>
    </tr>
    <tr>
        <td>Type password again</td>
        <td><input type="password" v-model="password2"/></td>
        <td><span v-if="password2!=password" style="color:red">Passwords not match.</span></td>
    </tr>
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
        <button>Download this key</button>
    </div>

    <p />
    <div>
        Following public key is needed to configure your server.
    </div>

    <div>
        <textarea readonly v-model="result_publickey"></textarea>
    </div>


</div>


</div>
</template>
<script>

import * as openpgp from "openpgp";


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


        result_privatekey: "",
        result_publickey: "",
        result_error: "",

        generating: false,
    }},

    computed: {

        may_generate(){
            return (
                !this.generating &&
                this.username != "" &&
                this.password != "" && this.password.length > 5 &&
                this.password2 == this.password
            );
        }

    },

    methods: {

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
                    passphrase: this.password,
                    format: "armored"
                });

                this.result_publickey = publicKey;
                this.result_privatekey = privateKey;
            } catch(e){
                this.result_publickey = this.result_privatekey = "";
                this.result_error = e.message;
            } finally {
                this.generating = false;
            }
        }

    }



}



</script>
