<template>
    <div :key="updateKey">
        <draggable class="list-group cursor-pointer" :list="condition" :animation="0" ghost-class="ghost-card" group="condition">
            <template v-for="(cond, idx) in filteredCondition" :key="idx">
                <div v-if="checkCondition(cond)" class="d-flex condition-box mt-2">
                    <v-combobox
                        :label="cond.key"
                        v-model="cond.key"
                        :items="varItems"
                        variant="outlined"
                        density="comfortable"
                        style="max-width: 120px;"
                    ></v-combobox>

                    <v-select
                        :label="cond.condition"
                        v-model="cond.condition"
                        :items="conditionList"
                        class="mx-1"
                        style="max-width: 100px;"
                    ></v-select>

                    <v-combobox
                        :label="cond.value"
                        v-model="cond.value"
                        :items="varItems"
                        variant="outlined"
                        density="comfortable"
                        style="max-width: 120px;"
                    ></v-combobox>

                    <div class="mt-1">
                        <v-btn icon variant="text"
                            density="comfortable"
                            class="ml-1"
                        >
                            <v-icon>mdi-file-tree</v-icon>
                            <!-- <DotsVerticalIcon /> -->
                            <v-menu activator="parent">
                                <v-list>
                                    <v-list-item v-for="menu in menuList" :key="menu" @click="changeCondition(cond, menu)">
                                        <v-list-item-title>{{ menu }}</v-list-item-title>
                                    </v-list-item>
                                </v-list>
                            </v-menu>
                        </v-btn>
                        <v-btn v-if="showSubAddCondition()" icon variant="text" @click="addCondition(idx)"
                            density="comfortable"
                            class="ml-1"
                        >
                            <v-icon>mdi-plus</v-icon>
                        </v-btn>
                        <v-btn v-if="filteredCondition.length > 1" icon variant="text" @click="deleteCondition(cond, idx)"
                            density="comfortable"    
                            class="ml-1"
                        >
                            <Icons :icon="'trash'" />
                        </v-btn>
                    </div>
                </div>
                <div v-else class="pa-3 border" style="border-radius:8px;">
                    <div class="d-flex">
                        <v-chip @click="changeConditionType(cond)" :color="getTypeColor(cond._type)" variant="flat">
                            {{ getTypeShortName(cond._type) }}
                        </v-chip>
                       
                        <v-btn v-if="showMainAddCondition(cond)" icon variant="text" class="ml-auto" @click="addCondition(idx)"
                                    density="comfortable"
                        >
                            <v-icon>mdi-plus</v-icon>
                        </v-btn>
                        <v-btn icon variant="text"  :class="showMainAddCondition(cond)? '': 'ml-auto'" @click="deleteCondition(cond, idx)"
                            density="comfortable"
                        >
                            <Icons :icon="'trash'" />
                        </v-btn>
                    </div>
                    <ConditionField :rootCond="cond" :value="cond.conditionsVt ? cond.conditionsVt : cond.condition" @update:value="(val) => updateChild(cond, val)" />
                </div>
            </template>
        </draggable>
    </div>
</template>

<script>
import { useBpmnStore } from '@/stores/bpmn';

export default {
    name: 'ConditionField',
    props: {
        rootCond: Object,
        value: Object
    },
    data() {
        return {
            condition: {},
            varItems: [],
            conditionList: ['==', '!=', '>', '>=', '<', '<='],
            menuList: ['AND', 'OR', 'NOT'],
            modeler: null,
            updateKey: 0,
        };
    },
    watch: {
        condition: {
            deep: true,
            handler(val) {
                // console.log('!!!', val);
                this.$emit('update:value', val);
                this.updateKey++; // update component
            }
        }
    },
    async created() {
        if (this.value) {
            this.condition = this.value;
        } else {
            this.condition = {
                _type: 'org.uengine.kernel.Evaluate',
                key: '',
                value: '',
                condition: ''
            };
        }
    },
    computed:{
        filteredCondition(){
            if (Array.isArray(this.condition)) {
               return this.condition;
            }
            return [this.condition]
        },
    },
    mounted() {
        const bpmnStore = useBpmnStore();
        const modeler = bpmnStore.getModeler;
        const def = modeler.getDefinitions();
        console.log(def);
        def.rootElements.forEach((ele) => {
            if (ele.$type == 'bpmn:Process') {
                ele.extensionElements?.values?.forEach((props) => {
                    if (props.$type == 'uengine:Properties') {
                        props.variables?.forEach((val) => {
                            this.varItems.push(val.$attrs.name);
                        });
                    }
                });
            }
        });
    },
    methods: {
        showSubAddCondition(){
            if(this.rootCond && this.rootCond._type.includes('Not')) return false;
            if(!Array.isArray(this.condition) && this.condition._type.includes('Evaluate')) return true
            return false
        },
        showMainAddCondition(conf){
            if(conf._type == 'org.uengine.kernel.Not') return false;

            return true;
        },
        updateChild(item, val) {
            if(item._type == 'org.uengine.kernel.Not')
            item.condition = val
        },
        changeConditionType(item){
            if(item._type == 'org.uengine.kernel.And'){
                item._type = 'org.uengine.kernel.Or';
            } else if(item._type == 'org.uengine.kernel.Or'){
                // item._type = 'org.uengine.kernel.Not';
                if(item.conditionsVt.length > 1) {
                    // 조건이 여러개 일땐 NOT x -> AND 변경
                    item._type = 'org.uengine.kernel.And'; 
                } else {
                    // 조건이 1개 일때만 
                    item.condition = {
                        _type: 'org.uengine.kernel.Evaluate',
                        key: '',
                        value: '',
                        condition: ''
                    }
                    delete item.conditionsVt;
                    item._type = 'org.uengine.kernel.Not';
                }
            } else if(item._type == 'org.uengine.kernel.Not'){
                if(!item.conditionsVt) {
                    item.conditionsVt = [];
                    item.conditionsVt.push(item.condition);
                }
                delete item.condition;
                item._type = 'org.uengine.kernel.And';
            }
        },
        getTypeColor(type) {
            if(type.includes('And')) {
                return 'primary';
            } else if(type.includes('Or')) {
                return 'success';
            } else if(type.includes('Not')) {
                return 'error';
            }
            return 'grey';
        },
        changeCondition(item, type) {
            if(!type) return;

            const child = JSON.parse(JSON.stringify(item));
            if ('AND'.toLowerCase() == type.toLowerCase()) {
                item._type = 'org.uengine.kernel.And';

                if(!item.conditionsVt) {
                    item.conditionsVt = [];
                    item.conditionsVt.push(child);
                }

                item.conditionsVt.push({
                    _type: 'org.uengine.kernel.Evaluate',
                    key: '',
                    value: '',
                    condition: ''
                });

               
                delete item.key;
                delete item.value;
                delete item.condition;
            } else if ('OR'.toLowerCase() == type.toLowerCase()) {
                item._type = 'org.uengine.kernel.Or';

                if(!item.conditionsVt) {
                    item.conditionsVt = [];
                    item.conditionsVt.push(child);
                }

                item.conditionsVt.push({
                    _type: 'org.uengine.kernel.Evaluate',
                    key: '',
                    value: '',
                    condition: ''
                });
                delete item.key;
                delete item.value;
                delete item.condition;
            } else if ('NOT'.toLowerCase() == type.toLowerCase()) {
                item._type = 'org.uengine.kernel.Not';
                delete item.key;
                delete item.value;
                delete item.condition;
            }
        },
        deleteCondition(item, idx) {
            if (Array.isArray(this.condition)) {
                this.condition.splice(idx, 1);
                if (this.condition.length == 0) {
                    this.condition = {
                        _type: 'org.uengine.kernel.Evaluate',
                        key: '',
                        value: '',
                        condition: ''
                    };
                }
            } else {
                this.condition = {
                    _type: 'org.uengine.kernel.Evaluate',
                    key: '',
                    value: '',
                    condition: ''
                };
            }
        },
        addCondition(idx) {
            if (Array.isArray(this.condition)) {
                let condition = this.condition[idx];
                let child = {
                    _type: 'org.uengine.kernel.Evaluate',
                    key: '',
                    value: '',
                    condition: ''
                }

                if(condition.conditionsVt){
                    condition.conditionsVt.push(child);
                } else {
                    this.condition.push(child);
                }
            } else {
                let conf = this.getTypeShortName(this.condition._type)
                conf = conf == 'Evaluate' ? 'AND' : conf;
                this.changeCondition(this.condition, conf);

                // if(this.condition && this.condition._type){
                //     let conf = this.getTypeShortName(this.condition._type)
                //     conf = conf == 'Evaluate' ? 'AND' : conf;
                //     this.changeCondition(this.condition, conf);
                // } else {
                //     this.changeCondition(this.condition, 'AND');
                // }
            }
        },
        checkCondition(item) {
            return item._type.includes('Evaluate');
        },
        // getConditions(item) {
        //     var result = [];
        //     if (Array.isArray(item)) {
        //         result = item;
        //     } else {
        //         result.push(item);
        //     }
        //     return result;
        // },
        getTypeShortName(type) {
            const parts = type.split('.');
            return parts[parts.length - 1];
        },
    }
};
</script>
