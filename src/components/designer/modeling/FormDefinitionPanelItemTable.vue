<template>
    <div>
        <v-container class="pa-0 ma-0">
            <div style="max-height:200px; overflow-y:auto; overflow-x:hidden;">
                <v-row v-for="(item, index) in localModelValue" :key="index" class="pa-0 ma-0">
                    <template v-for="(val, key) in item" :key="key">
                        <template v-if="index === itemIndexToEdit">
                            <v-text-field ref="inputKeyToEditItem" class="centered-input" label="Key" v-model.trim="keyToEdit"
                                            :rules="[v => !!v || 'Key is required']" required @keyup.enter="editItem(index)"
                                            @input="onInputKeyToEdit" persistent-placeholder></v-text-field>
                            <v-text-field ref="inputValueToEditItem" class="centered-input" label="Value" v-model.trim="valueToEdit" @keyup.enter="editItem(index)"
                                            :placeholder="placeholder.valueToEdit" persistent-placeholder></v-text-field>
                            <v-sheet class="pb-5">
                                <v-tooltip :text="$t('uiDefinition.cancel')">
                                <template v-slot:activator="{ props }">
                                    <v-btn icon flat @click="itemIndexToEdit = -1" v-bind="props">
                                    <v-icon style="color: red;">mdi-close</v-icon>
                                    </v-btn>
                                </template>
                                </v-tooltip>
                            </v-sheet>

                            <v-sheet class="pb-5">
                                <v-tooltip :text="$t('uiDefinition.edit')">
                                <template v-slot:activator="{ props }">
                                    <v-btn icon flat @click="editItem(index)" v-bind="props">
                                    <PencilIcon stroke-width="1.5" size="20" class="text-primary" />
                                    </v-btn>
                                </template>
                                </v-tooltip>
                            </v-sheet>
                        </template>
                        <template v-else>
                            <v-col cols="5" class="d-flex align-center justify-center pa-0">
                            {{ key }}
                            </v-col>
                            <v-col cols="5" class="d-flex align-center justify-center pa-0">
                            {{ val }}
                            </v-col>
                            <v-col cols="2" class="d-flex align-center justify-center pa-0">
                                <v-sheet>
                                    <v-tooltip :text="$t('uiDefinition.edit')">
                                    <template v-slot:activator="{ props }">
                                        <v-btn icon flat @click="itemIndexToEdit = index; keyToEdit = key; valueToEdit = val; placeholder.valueToEdit = key" v-bind="props">
                                            <PencilIcon stroke-width="1.5" size="20" class="text-primary" />
                                        </v-btn>
                                    </template>
                                    </v-tooltip>
                                </v-sheet>

                                <v-sheet>
                                    <v-tooltip :text="$t('uiDefinition.delete')">
                                    <template v-slot:activator="{ props }">
                                        <v-btn icon flat @click="deleteItem(index)" v-bind="props">
                                            <TrashIcon stroke-width="1.5" size="20" class="text-error" />
                                        </v-btn>
                                    </template>
                                    </v-tooltip>
                                </v-sheet>
                            </v-col>
                        </template>
                    </template>
                </v-row>
            </div>

            <v-row class="ma-0 pa-0 mt-4">
                <v-text-field ref="inputKeyToAddItem" class="centered-input" label="Key" v-model.trim="keyToAdd" @keyup.enter="addItem"
                                @input="onInputKeyToAdd" persistent-placeholder></v-text-field>

                <v-text-field ref="inputValueToAddItem" class="centered-input" label="Value" v-model.trim="valueToAdd" @keyup.enter="addItem"
                                :placeholder="placeholder.valueToAdd" persistent-placeholder></v-text-field>

                <v-sheet>
                    <v-tooltip :text="$t('uiDefinition.add')">
                    <template v-slot:activator="{ props }">
                        <v-btn icon flat @click="addItem" v-bind="props">
                            <v-icon size="33">mdi-plus</v-icon>
                        </v-btn>
                    </template>
                    </v-tooltip>
                </v-sheet>
            </v-row>
        </v-container>
    </div>
</template>

<script>
export default {
    name: "FormDefinitionPanelItemTable",
    
    props: {
        modelValue: Array
    },

    data() {
        return {
            localModelValue: this.modelValue,

            keyToAdd: "",
            valueToAdd: "",

            itemIndexToEdit: -1,
            keyToEdit: "",
            valueToEdit: "",

            placeholder: {
              valueToAdd: "",
              valueToEdit: ""
            },

            regexStr: /^[가-힣a-zA-Z0-9_\-. ]+$/,
            regexErrorMsg: "'{{propName}}'은 한글, 영문, 숫자, 공백, 밑줄(_), 대시(-), 점(.) 만 입력 가능합니다!"
        };
    },

    watch: {
        modelValue: {
            handler() {
                this.localModelValue  = this.modelValue
            },
            deep: true,
            immediate: true
        },

        localModelValue: {
            handler() {
                this.$emit('update:modelValue', this.localModelValue)
            },
            deep: true,
            immediate: true
        }
    },

    methods: {
        addItem() {
            //#region 유효성 검사
            if(!(this.keyToAdd) || this.keyToAdd.length <= 0) {
                alert("Key is required")
                this.$refs.inputKeyToAddItem.focus();
                return
            }
            if(!this.regexStr.test(this.keyToAdd)) {
                alert(this.regexErrorMsg.replace("{{propName}}", "Key"))
                this.$refs.inputKeyToAddItem.focus();
                return
            }
            if(this.localModelValue.some(item => item.hasOwnProperty(this.keyToAdd))) {
                alert("Key already exists")
                this.$refs.inputKeyToAddItem.focus();
                return
            }

            if(this.valueToAdd && this.valueToAdd.length > 0) {
                if(!this.regexStr.test(this.valueToAdd)) {
                    alert(this.regexErrorMsg.replace("{{propName}}", "Value"))
                    this.$refs.inputValueToAddItem.focus();
                    return
                }
            }
            //#endregion
            //#region 입력값 처리
            if(!(this.valueToAdd) || this.valueToAdd.length <= 0) {
                this.valueToAdd = this.keyToAdd
            }
            //#endregion

            this.localModelValue.push({ [this.keyToAdd]: this.valueToAdd })
            this.keyToAdd = ""
            this.valueToAdd = ""   
            this.placeholder.valueToAdd = ""
            
            this.$nextTick(() => {
                this.$refs.inputKeyToAddItem.focus();
            });
        },

        editItem(itemIndexToEdit) {
            //#region 유효성 검사
            if(!(this.keyToEdit) || this.keyToEdit.length <= 0) {
                alert("Key is required")
                this.$refs.inputKeyToEditItem[0].focus();
                return
            }
            if(!this.regexStr.test(this.keyToEdit)) {
                alert(this.regexErrorMsg.replace("{{propName}}", "Key"))
                this.$refs.inputKeyToEditItem[0].focus();
                return
            }

            // 키가 기존의 값과 달라진 경우에만 중복 여부를 검사하기 위해서
            if(!(this.localModelValue[itemIndexToEdit].hasOwnProperty(this.keyToEdit))) {
                if(this.localModelValue.some(item => item.hasOwnProperty(this.keyToEdit))) {
                    alert("Key already exists")
                    this.$refs.inputKeyToEditItem[0].focus();
                    return
                }
            }

            if(this.valueToEdit && this.valueToEdit.length > 0) {
                if(!this.regexStr.test(this.valueToEdit)) {
                    alert(this.regexErrorMsg.replace("{{propName}}", "Value"))
                    this.$refs.inputValueToEditItem[0].focus();
                    return
                }
            }
            //#endregion
            //#region 입력값 처리
            if(!(this.valueToEdit) || this.valueToEdit.length <= 0) {
                this.valueToEdit = this.keyToEdit
            }
            //#endregion

            this.localModelValue.splice(itemIndexToEdit, 1, { [this.keyToEdit]: this.valueToEdit })

            this.itemIndexToEdit = -1
            this.keyToEdit = ""
            this.valueToEdit = ""
            this.placeholder.valueToEdit = ""
        },

        deleteItem(itemIndexToDelete) {
            this.localModelValue.splice(itemIndexToDelete, 1)
        },


        onInputKeyToAdd() {
            this.placeholder.valueToAdd = this.keyToAdd
        },

        onInputKeyToEdit() {
            this.placeholder.valueToEdit = this.keyToEdit
        }
    }
}
</script>