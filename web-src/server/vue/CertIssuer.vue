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
        <input type="file" />
        <br />
        Type your password to use this key: <input type="password" />
    </td>
</tr>

<tr>
    <td>User's public key</td>
    <td>
        <textarea></textarea>
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
        >
        </TagGrantChooser>
        <TagGrantChooser
            :tag="{}"
            :index="-1"
            @add="add_tag"
        ></TagGrantChooser>

    </td>
</tr>



</table>






</template>
<script>
import TagGrantChooser from "sfc/TagGrantChooser.vue";
const _ = require("lodash");

export default {

    data(){ return {

        tags: [],

    } },

    methods: {
        add_tag(){
            this.tags.push({});
        },

        remove_tag(i){
            _.remove(this.tags, (_, _i)=>_i==i);
        },
    },

    components: {
        TagGrantChooser,
    }
}

</script>
