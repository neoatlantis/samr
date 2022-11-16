<template>
<div style="border: 1px solid grey">

Do a RPC call: <br />
<input type="text" v-model="topic" placeholder="topic"/>
<br />
<textarea v-model="payload" placeholder="JSON"/>
<br />
<button @click="call">call</button>

</div>
</template>
<script>
import conn from "app/conn";
const _ = require("lodash");

export default {
    data(){ return {
        topic: "",
        payload: "",
    }},

    computed: {
        payload_ok(){
            try{
                JSON.parse(payload);
                return true;
            } catch(e){
                return false;
            }
        }
    },

    methods: {
        async call(){
            let client;
            try{
                client = conn();
            } catch(e){
                this.$emit("log", "Error: client not initialized.");
            }

            try{
                this.$emit("log", "RPC call on: " + this.topic + " with data: " + this.payload);

                let r = await client.call(this.topic, JSON.parse(this.payload));
                this.$emit("log", "RPC result:" + JSON.stringify(r));

            } catch(e){
                this.$emit("log", "RPC call error:" + e);
            }

        }
    }

}

</script>
