<template>

Issue a new certificate to a given holder. The holder will use this certificate
later to join your server.
<p />
You need following data:
<ul>
    <li>Your private authority key. This must corresponds to the public key loaded to SAMR server, so that the server will recognize your issuance;</li>
    <li>Holder's public key. This identifies the user who is authorized to use the certificate;</li>
    <li>A list of tags and rights that's going to be recorded in the certificate (user's application). You will authorize the user to join given topics.</li>
</ul>

<table>

<tr>
    <td>Your authority key</td>
    <td>
        <input type="file" accept=".asc" @change="on_authority_key_upload"/>
        <br />
        Type your password to use this key:
        <input type="password" v-model="authority_password" @change="parse_authority_key"/>
        <br />
        <span v-if="authority_key_error" style="color:red">
            {{ authority_key_error }}
        </span>
        <span v-if="authority_key_success" style="color:green">
            Authority key loaded successfully.
        </span>
    </td>
</tr>

<tr>
    <td>User's public key</td>
    <td>
        <textarea v-model="user_key_armored" @change="parse_user_public_key"></textarea>
        <br />
        <span v-if="user_key_error" style="color:red">
            {{ user_key_error }}
        </span>
        <span v-if="user_key_success" style="color:green">
            User key loaded successfully.
        </span>
    </td>
</tr>

<tr>
    <td>Tags granted</td>
    <td>
        <TagGrantChooser
            v-for="(tag, tag_i) in tags"
            :tag="tag"
            :index="tag_i"
            @remove="remove_tag"
            @update="update_tag"
        >
        </TagGrantChooser>
        <TagGrantChooser
            :tag="{}"
            :index="-1"
            @add="add_tag"
        ></TagGrantChooser>

    </td>
</tr>


<tr>
    <td colspan="2">
        <button
            @click="generate"
            :disabled="!input_valid"
        >Generate</button>
    </td>
</tr>


</table>

<textarea v-if="result" v-model="result" readonly></textarea>


</template>
<script>
import TagGrantChooser from "sfc/TagGrantChooser.vue";
import read_upload_file_text from "libs/read_upload_file_text";
import * as openpgp from "openpgp";


const _ = require("lodash");

const createOpenPGPCertIssuer = require("libs/openpgp-auth/OpenPGPCertIssuer");






export default {

    data(){ return {

        authority_private_key_armored: "",
        authority_private_key_read: null,
        authority_password: "",
        authority_key_error: false,
        authority_key_success: false,

        user_key_armored: "",
        user_key_read: null,
        user_key_error: false,
        user_key_success: false,

        tags: [],

        result: "",
    } },

    computed: {

        input_valid(){
            let tags_all_valid =
                this.tags.map((e)=>e.valid).every((e)=>e===true);
            return (
                tags_all_valid &&
                this.authority_key_success &&
                this.user_key_success
            );
        }

    },

    methods: {

        async on_authority_key_upload(e){
            this.authority_private_key_armored =
                await read_upload_file_text(e.target);
            this.authority_password = "";
            this.authority_key_error = "";
            this.authority_key_success = false;
        },

        parse_authority_key: _.debounce(async function(){
            this.authority_private_key_read = null;
            try{
                const privateKey = await openpgp.decryptKey({
                    privateKey: await openpgp.readPrivateKey({
                        armoredKey: this.authority_private_key_armored
                    }),
                    passphrase: this.authority_password,
                });
                this.authority_private_key_read = privateKey;
                this.authority_key_error = "";
                this.authority_key_success = true;
            } catch(e){
                this.authority_key_error = e.message;
                this.authority_key_success = false;
            }
        }, 500),

        parse_user_public_key: _.debounce(async function(){
            if(!this.user_key_armored.trim()){
                return;
            }
            this.user_key_read = null;
            try{
                const publicKey = await openpgp.readKey({
                    armoredKey: this.user_key_armored,
                });
                if(publicKey.isPrivate()){
                    throw Error("Supplied key is not a public key.");
                }
                this.user_key_error = false;
                this.user_key_success = true;
                this.user_key_read = publicKey;
            } catch(e){
                this.user_key_error = e.message;
                this.user_key_success = false;
            }
        }, 500),


        add_tag(){
            this.tags.push({});
        },

        remove_tag(i){
            _.remove(this.tags, (_, _i)=>_i==i);
        },

        update_tag(e){
            this.tags[e.index] = {
                name: e.name,
                attrs: e.attrs,
                valid: e.valid,
            };
        },

        async generate(){
            let authority = await createOpenPGPCertIssuer(
                this.authority_private_key_read);

            let bearer_public_key = this.user_key_read;

            let cert = await authority
                .bearer_fingerprint(bearer_public_key.getFingerprint())
                .validity_duration(365*86400)
            ;

            for(let { name, attrs } of this.tags){
                cert.tag(name, attrs);
            }

            this.result = await cert.go();
        }
    },

    components: {
        TagGrantChooser,
    }
}

</script>
