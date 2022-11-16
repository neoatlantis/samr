<template>
<div style="border: 1px solid grey">

Publish a event to topic: <br />
<input type="text" v-model="topic" placeholder="topic"/>
<br />
<textarea v-model="payload" placeholder="JSON"/>
<br />
<button @click="publish">Publish</button>

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
        async publish(){
            let client;
            try{
                client = conn();
            } catch(e){
                this.$emit("log", "Error: client not initialized.");
            }

            try{
                await client.publish(this.topic, JSON.parse(this.payload));
                this.$emit("log", "Published topic: " + this.topic + " with data: " + this.payload);

            } catch(e){
                this.$emit("log", "Publish error:" + e);
            }

        }
    }

}

</script>
