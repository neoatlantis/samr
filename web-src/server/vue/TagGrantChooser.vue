<template>

<div v-if="index==-1">
    <button @click="add">Add</button>
</div>
<div v-else>
    <input v-model="tag_name" />


    <a href="#" @click="remove">[Remove]</a>
</div>




</template>
<script>
export default {
    props: ["tag", "index"],

    data(){ return {
        tag_name: "",
    }},

    watch: {
        tag(){
            this.tag_name = this.tag.name || "";
        }
    },

    methods: {

        add(){
            this.$emit("add");
        },

        remove(e){
            e.preventDefault();
            this.$emit("remove", this.index);
        },

    }

}
</script>
