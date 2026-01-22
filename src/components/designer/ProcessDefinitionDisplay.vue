<template>
    <div class="included" style="margin-bottom: 22px">
        
        <v-autocomplete
                v-model="value"
                :items="items"
                :disabled="disabled"
                :item-title="bindOptions.itemTitle"
                :item-value="bindOptions.itemValue"
                :color="bindOptions.color"
                :label="options.label"
                :variant="bindOptions.variant"
                :hide-details="bindOptions.hideDetails"
                :return-object="bindOptions.returnObject"
                :loading="loading"
        >
            <template v-slot:item="{ props, item }">
                <v-list-item
                    v-if="mode == 'ProcessGPT'"
                    v-bind="props"
                    :title="item.raw[bindOptions.itemTitle]"
                ></v-list-item>
                <v-list-item
                    v-else
                    v-bind="props"
                    :subtitle="item.raw.displayPath"
                    :title="item.raw[bindOptions.itemTitle]"
                ></v-list-item>
            </template>
            <!-- <template v-slot:item="{ item }">
                <div style="margin: 5px;" @click="selectItem(item.raw)">
                    <div v-if="bindOptions.returnObject">
                        <div style="font-size: 0.8em; color: grey;">{{ item.raw.displayPath }}</div>
                        <div>{{ item.raw[bindOptions.itemTitle] }}</div>
                    </div>
                    <div v-else>
                        <div>{{ item.raw }}</div>
                    </div>
                </div>
            </template> -->
        </v-autocomplete>
    </div>
</template>

<script>
import BackendFactory from '@/components/api/BackendFactory';
import { ref, watch } from 'vue';

export default {
    props:{
        modelValue: {
            type: Object,
            required: true
        },
        fileExtensions: {
            type: Array,
            default: []
        },
        disabled: {
            type: Boolean,
            default: false
        },
        options:{
            type: Object,
            default: {}
        }
    },
    computed:{
        bindOptions(){
            return {
                color: this.options.color || 'primary',
                itemTitle: this.options.itemTitle || 'name',
                itemValue: this.options.itemValue || 'value',
                label: this.options.label || 'Select Definition',
                variant: this.options.variant || 'outlined',
                hideDetails: this.options.hideDetails || false,
                returnObject: this.options.returnObject || false
            }
        },
        mode() {
            return window.$mode;
        }
    },
    data() {
        return {
            backend: null,
            items: [],
            value: this.modelValue,
            loading: false
        }
    },
    created(){
        console.log(this.options)
        this.init()
    },
    watch:{
        "value":function(){
            this.$emit('update:modelValue', this.value)
        },
    },
    methods:{
        init(){
            var me = this
            me.$try({
                context: me,
                async action() {
                    me.loading = true
                    me.backend = BackendFactory.createBackend();
                    let lists = []
                    if (me.mode == 'ProcessGPT') {
                        lists = await me.retrieveFolder()
                    } else {
                        lists = await me.retrieveFolder()
                    }                  
                    lists = lists.filter(item => !item.directory)

                    if(me.fileExtensions.length > 0 && me.mode !== 'ProcessGPT') {
                        lists = lists.filter(item => me.fileExtensions.some(extension => item.name.endsWith(extension)));
                    }

                    lists = lists.map(item => {
                        const { _links, ...rest } = item; // _links 속성을 제거합니다.
                        return {
                            ...rest,
                            id: item.id ? item.id : item.path.split('.')[0],
                        };
                    })
                
                    // item: {
                    //     name:"test.form"
                    //     directory:false
                    //     path:"form/test.form"
                    //     displayPath:"/form"
                    //     id:"form/test"
                    // }
                    
                    me.items = lists
                    me.loading = false
                    if(me.value){
                        const selectedItem = me.items.find(item => item.path === me.value.filePath);
                        if(selectedItem) {
                            me.value = selectedItem;
                        }
                    }
                   
                }
            });

        },
        async retrieveFolder(path) {
            var me = this
            let lists = await me.backend.listDefinition(path);
            let results = [];
            if(!lists) {
                return results
            }
            for (const item of lists) {
                if (item.directory) {
                    item.displayPath = `/${item.name}`;
                    let children = await me.retrieveFolder(item.name);
                    results = results.concat(children);
                } else {
                    item.displayPath = item.directory ? `${path}/${item.name}`: (path ? `/${path}` : '/')
                }
                results.push(item);
            }
            return results;
        },
        selectItem(item){
            this.value = this.bindOptions.returnObject ? item : item[this.bindOptions.itemTitle]
        }
    }
}
</script>

