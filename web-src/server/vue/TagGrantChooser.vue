<template>

<div v-if="index==-1">
    <button @click="add">Add</button>
</div>
<div v-else>
    <input v-model="tag_name" v-bind:class="{invalid:!this.tag_valid}"/>

    with rights:

    <input type="checkbox" checked disabled><label>Subscribe</label>
    <input type="checkbox" :id="'checkbox-publish-' + index" v-model="attr_publish"/><label :for="'checkbox-publish-' + index">Publish</label>
    &nbsp;
    <input type="checkbox" :id="'checkbox-call-' + index" v-model="attr_call"/><label :for="'checkbox-call-' + index">Call</label>
    <input type="checkbox" :id="'checkbox-yield-' + index" v-model="attr_yield"/><label :for="'checkbox-yield-' + index">Yield</label>

    &nbsp; &nbsp; &nbsp; &nbsp;

    <a href="#" @click="remove">[Remove]</a>
</div>




</template>
<script>
const uri_checker= require("libs/uri");
const _ = require("lodash");


export default {
    props: ["tag", "index"],

    data(){ return {
        tag_name: "",
        attr_publish: false,
        attr_call: false,
        attr_yield: false,
    }},

    watch: {
        tag(){
            this.tag_name = this.tag.name || "";
            this.attr_publish = _.includes(this.tag.attrs, "publish");
            this.attr_call    = _.includes(this.tag.attrs, "call");
            this.attr_yield   = _.includes(this.tag.attrs, "yield");
        },

        tag_name(){ this.update() },
        attr_publish(){ this.update() },
        attr_call(){ this.update() },
        attr_yield(){ this.update() },
    },

    computed: {
        tag_valid(){
            return uri_checker.is_valid_pattern(this.tag_name);
        }
    },

    methods: {

        update(){
            this.$emit("update", {
                index: this.index,
                name: this.tag_name.trim(),
                attrs: _.compact([
                    this.attr_publish ? "publish": null,
                    this.attr_call ? "call": null,
                    this.attr_yield ? "yield": null,
                ]),
                valid: this.tag_valid,
            })
        },

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
