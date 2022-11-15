<template>

<span v-if="connected" style="color:green">Connected</span>
<span v-else style="color:red">Disconnected</span>

&nbsp;&nbsp;-&nbsp;&nbsp;

<span v-if="authenticated" style="color:green">Authenticated</span>
<span v-else style="color:red">Not authenticated</span>

</template>
<script>
import conn from "app/conn";

export default {
    mounted(){
        let self = this;
        setInterval(()=>{
            try{
                let client = conn();
                self.connected = client.status.connected;
                self.authenticated = client.status.authenticated;
            } catch(e){
            }
        }, 500);
    },

    data(){ return {
        connected: false,
        authenticated: false,
    }}
}
</script>
