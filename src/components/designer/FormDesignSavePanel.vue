<template>
    <v-card
    class="mx-auto my-8 form-save-box"
    elevation="16"
    max-width="400"
    >
        <v-card-title class="ma-0 pa-0" style="padding: 15px 0px 0px 25px !important;">{{ ((savedId) ? "UpdateForm" : "NewForm") }}</v-card-title>
        <v-icon @click="$emit('onClose')" class="form-dialog-close-btn">mdi-close</v-icon>

        <v-card-text>
            <v-col>
                <v-text-field ref="inputId" v-model.trim="infoToSave.id" label="ID" @keyup.enter="save" 
                              :placeholder="placeholder.id" persistent-placeholder :disabled="!!savedId"></v-text-field>
            </v-col>
        </v-card-text>

        <v-card-actions style="justify-content: right;">
            <v-btn ref="saveButton" @click="save" @keyup.enter="save" > SAVE </v-btn>
        </v-card-actions>
    </v-card>
</template>

<script>
export default {
    name: 'FormDesignSavePanel',
    emits: [
        "onClose",
        "onSave"
    ],
    props: {
        savedId: String,
        formNameByUrl: String
    },
    data: () => ({
        infoToSave: {
            id: ""
        },

        placeholder: {
            id: ""
        },

        default: {
            id: `untitled/${Date.now()}`
        },

        regexStr: /^[가-힣a-zA-Z0-9_\-. \/]+$/,
        regexErrorMsg: "'{{propName}}'은 한글, 영문, 숫자, 공백, 밑줄(_), 대시(-), 점(.), 슬래시(/)만 입력 가능합니다!"
    }),
    methods: {
        save() {
            //#region 입력값 처리
            if(!(this.infoToSave.id) || this.infoToSave.id.length <= 0) {
                this.infoToSave.id = this.default.id
            }
            //#endregion
            //#region 유효성 검사
            if(!this.regexStr.test(this.infoToSave.id)) {
                alert(this.regexErrorMsg.replace("{{propName}}", "ID"))
                this.$refs.inputId.focus();
                return
            }
            //#endregion

            this.$emit('onSave', this.infoToSave)
        },
    },
    
    created() {
        this.placeholder.id = this.default.id

        if(this.savedId) {
            this.infoToSave.id = this.savedId
        }

        if(this.formNameByUrl && this.formNameByUrl.length > 0) {
            this.infoToSave.id = this.formNameByUrl
        }
    },
    mounted() {
        if(this.savedId) {
            this.$nextTick(() => {
                this.$refs.saveButton.$el.focus();
            });
        } else {
            this.$nextTick(() => {
                this.$refs.inputId.focus();
            });
        }
    },
};
</script>
