<template>

<h2>SAMR Server</h2>
<p />

<nav>
<button @click="display=1">[PGP Key Generation]</button>
<button @click="display=2">[Issue Cert]</button>
</nav>

<hr />

<PGPKeyGeneration v-if="1==display"></PGPKeyGeneration>

</template>
<script>

import PGPKeyGeneration from "sfc/PGPKeyGeneration.vue";

export default {

    data(){ return {
        display: 1,

    } },

    components: {
        PGPKeyGeneration,
    }

}





</script>
