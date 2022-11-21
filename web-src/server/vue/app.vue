<template>

<h2>SAMR Server</h2>


<p />

<nav>
<button @click="display=1">[PGP Key Generation]</button>
<button @click="display=2">[Issue Cert]</button>
</nav>

<hr />

<PGPKeyGeneration v-if="1==display"></PGPKeyGeneration>
<CertIssuer v-if="2==display"></CertIssuer>

</template>
<script>

import PGPKeyGeneration from "sfc/PGPKeyGeneration.vue";
import CertIssuer from "sfc/CertIssuer.vue";

export default {

    data(){ return {
        display: 1,
        /// #if DEV
        display: 1,
        /// #endif
    } },

    components: {
        PGPKeyGeneration,
        CertIssuer,
    }

}





</script>
