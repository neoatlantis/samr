<template>
<div style="border: 1px solid grey">

Join or leave a topic: <br />
<input type="text" v-model="topic" />
<br />
<button @click="join">Join</button>
<button @click="leave">Leave</button>

</div>
</template>
<script>
import conn from "app/conn";
const _ = require("lodash");

export default {
    data(){ return {
        topic: "",
    }},

    methods: {
        async join(){
            let client;
            try{
                client = conn();
            } catch(e){
                this.$emit("log", "Error: client not initialized.");
            }

            try{
                await client.join(this.topic);
                this.$emit("log", "Joined topic: " + this.topic);
            } catch(e){
                this.$emit("log", "Join error:" + e);
            }

        },

        async leave(){
            let client;
            try{
                client = conn();
            } catch(e){
                this.$emit("log", "Error: client not initialized.");
            }

            try{
                await client.leave(this.topic);
                this.$emit("log", "Left topic: " + this.topic);
            } catch(e){
                this.$emit("log", "Leaving error:" + e);
            }
        },
    }

}

</script>
