<template>
    <div class="form-checkbox-box">
        <label class="form-checkbox-label">{{(localAlias && localAlias.length > 0) ? localAlias : localName}}</label>
        <div v-for="(item, index) in controlItems" :key="index">
            <div v-for="(value, key) in item" :key="key">
                <v-checkbox
                    v-model="localModelValue"
                    :label="value"
                    :value="key"
                    :disabled="localDisabled"
                    :readonly="localReadonly"
                    :hide-details="localErrorMessage ? false : hideDetails"
                    :density="density"
                    :error="!!localErrorMessage"
                ></v-checkbox>
            </div>
        </div>
        <div v-if="localErrorMessage" class="custom-input-details custom-input-details--error">
            {{ localErrorMessage }}
        </div>
    </div>
</template>

<script>
import { commonSettingInfos } from "./CommonSettingInfos.vue"
import axios from 'axios';
import jp from 'jsonpath';
import BackendFactory from "@/components/api/BackendFactory";
const backend = BackendFactory.createBackend();

export default {
    props: {
        // UI 관련 설정 props 시작 
        hideDetails: {
            type: Boolean,
            default: false
        },
        density: {
            type: String,
            default: 'compact'
        },
        // UI 관련 설정 props 끝
        modelValue: Array,
        vueRenderUUID: String,
        tagName: String,

        name: String,
        alias: String,
        disabled: String,
        readonly: String,

        items: String,
        is_dynamic_load: {
            type: String,
            default: "fixed"
        },
        dynamic_load_url_name: String,
        dynamic_load_key_json_path: String,
        dynamic_load_value_json_path: String,
        dynamic_load_url: String,
        dynamic_load_key_column: String,
        dynamic_load_value_column: String,
        dynamic_data_source: String
    },

    data() {
        return {
            localModelValue: "",

            localName: "",
            localAlias: "",
            localItems: [],
            localDisabled: false,
            localReadonly: false,

            localIsDynamicLoad: "",
            localDynamicLoadURL: "",
            localDynamicLoadKeyJsonPath: "",
            localDynamicLoadValueJsonPath: "",
            localDynamicLoadURLName: "",
            localDynamicLoadKeyColumn: "",
            localDynamicLoadValueColumn: "",
            localDynamicDataSource: "",

            controlItems: [],

            settingInfos: [
                commonSettingInfos["localName"],
                commonSettingInfos["localAlias"],
                commonSettingInfos["localDisabled"],
                commonSettingInfos["localReadonly"],
                ...commonSettingInfos["localItemsWithDynamicList"]
            ],
            dataSource: {},
            dataSources: [],
            localErrorMessage: ""
        };
    },

    watch: {
        modelValue: {
            async handler() {
                await this.loadControlItems()
                
                if(JSON.stringify(this.localModelValue) === JSON.stringify(this.modelValue)) return
                this.localModelValue = (this.modelValue && this.modelValue.length > 0) ? this.modelValue : []
            },
            deep: true,
            immediate: true
        },

        localModelValue: {
            handler() {
                if(JSON.stringify(this.localModelValue) === JSON.stringify(this.modelValue)) return
                this.$emit('update:modelValue', this.localModelValue)
            },
            deep: true,
            immediate: true
        },

        localItems: {handler() {this.loadControlItems()}, deep: true, immediate: true},
        localIsDynamicLoad: {handler() {this.loadControlItems()}, deep: true, immediate: true},
        localDynamicLoadURLName: {handler() {this.loadControlItems()}, deep: true, immediate: true},
        localDynamicLoadKeyColumn: {handler() {this.loadControlItems()}, deep: true, immediate: true},
        localDynamicLoadValueColumn: {handler() {this.loadControlItems()}, deep: true, immediate: true},
        localDynamicLoadURL: {handler() {this.loadControlItems()}, deep: true, immediate: true},
        localDynamicLoadKeyJsonPath: {handler() {this.loadControlItems()}, deep: true, immediate: true},
        localDynamicLoadValueJsonPath: {handler() {this.loadControlItems()}, deep: true, immediate: true},
        localDynamicDataSource: {handler() {this.loadControlItems()}, deep: true, immediate: true}
    },

    methods: {
        // 문자열로 형태로 items의 값이 전달되었을 경우, 리스트 형태로 변환해서 반영시키기 위해서
        async loadControlItems() {
            if(this.localIsDynamicLoad === "urlBinding") {
                if(!this.localDynamicLoadURL || this.localDynamicLoadURL.length === 0) return
                if(!this.localDynamicLoadKeyJsonPath || this.localDynamicLoadKeyJsonPath.length === 0) return
                if(!this.localDynamicLoadValueJsonPath || this.localDynamicLoadValueJsonPath.length === 0) return

                try {
                    let config = {}
                    if (this.localDynamicLoadURL.includes(':54321')) {
                        if(config.headers === undefined) {
                            config.headers = {
                                'Authorization': 'Bearer ' + window.$supabase.supabaseKey
                            };
                        } else {
                            config.headers['Authorization'] = 'Bearer ' + window.$supabase.supabaseKey
                        }
                    }


                    const response = await axios.get(this.localDynamicLoadURL, config)

                    if(this.localDynamicLoadKeyJsonPath &&
                     this.localDynamicLoadKeyJsonPath.length > 0 && 
                     this.localDynamicLoadValueJsonPath &&
                      this.localDynamicLoadValueJsonPath.length > 0) {
                        const keys = jp.query(response.data, this.localDynamicLoadKeyJsonPath)
                        const values = jp.query(response.data, this.localDynamicLoadValueJsonPath)

                        if(keys.length !== values.length) throw new Error("keys.length != values.length")
                        this.controlItems = keys.map((key, index) => ({ [key]: values[index] }))
                    } else {
                        let keys = [];
                        let values = [];
                        Object.keys(response.data).forEach(item => {
                            keys.push(item)
                            values.push(response.data[item])
                        })
                        this.controlItems = keys.map((key, index) => ({ [key]: values[index] }))
                    }
                    this.localErrorMessage = ""
                } catch(e) {
                    console.log("### items 동적 로드 에러 ###")
                    console.error(e)
                    this.localErrorMessage = "데이터를 불러오지 못했습니다"
                }

            } else if(this.localIsDynamicLoad === "dataBinding" && this.localDynamicLoadKeyColumn.length > 0 && this.localDynamicDataSource.length > 0) {
                try {
                    const response = this.dataSource;
                    const keyPath = "$[*]." + this.localDynamicLoadKeyColumn;
                    const valuePath = "$[*]." + this.localDynamicLoadValueColumn;
                    const keys = jp.query(response, keyPath);
                    const values = jp.query(response, valuePath);

                    if(keys.length !== values.length) throw new Error("keys.length != values.length")
                    this.controlItems = keys.map((key, index) => ({ [key]: values[index] }))
                    this.localErrorMessage = ""
                } catch(e) {
                    console.log("### 데이터소스 처리 에러 ###")
                    console.error(e)
                    console.error("데이터소스가 올바르지 않습니다")
                    this.controlItems = []
                    this.localErrorMessage = "데이터소스가 올바르지 않습니다"
                }
            } else {
                this.controlItems = this.localItems
                this.localErrorMessage = ""
            }
        },
        async loadDataSource() {
            if(this.localIsDynamicLoad != "dataBinding") return;
            try {
                this.dataSources = await backend.getDataSourceList();
                const dataSource = this.dataSources.find(ds => ds.key === this.localDynamicDataSource)
                if(!dataSource) throw new Error("데이터소스를 찾을 수 없습니다")

                let cloned = JSON.parse(JSON.stringify(dataSource))
                cloned.value.endpoint = cloned.value.endpoint + this.localDynamicLoadURLName.replace("/", "");

                const response = await backend.callDataSource(cloned, {})
                this.dataSource = response
                this.localErrorMessage = ""
            } catch(e) {
                console.log("### 데이터소스 로드 에러 ###")
                console.error(e)
                console.error("데이터소스가 올바르지 않습니다")
                this.dataSource = {}
                this.localErrorMessage = "데이터소스가 올바르지 않습니다"
            }
        }
    },

    async created() {
        this.localModelValue = this.modelValue ?? []
        
        this.localName = this.name ?? "name"
        this.localAlias = this.alias ?? ""
        this.localDisabled = this.disabled === "true"
        this.localReadonly = this.readonly === "true"

        try {
            if(!(this.items) || this.items.length === 0)
                this.localItems = []
            else if(typeof(this.items) === "string")
                this.localItems = JSON.parse(this.items.replace(/'/g, '"'))
            else
                this.localItems = this.items
        } catch (e) {
            console.log("### items 파싱 에러 ###")
            console.log(this.items.replace(/'/g, '"'))
            console.error(e);
            this.localItems = []
        }
        this.localIsDynamicLoad = this.is_dynamic_load ?? "fixed"
        this.localDynamicLoadURLName = this.dynamic_load_url_name ?? ""
        this.localDynamicLoadKeyColumn = this.dynamic_load_key_column ?? ""
        this.localDynamicLoadValueColumn = this.dynamic_load_value_column ?? ""
        this.localDynamicLoadURL = this.dynamic_load_url ?? ""
        this.localDynamicLoadKeyJsonPath = this.dynamic_load_key_json_path ?? ""
        this.localDynamicLoadValueJsonPath = this.dynamic_load_value_json_path ?? ""
        this.localDynamicDataSource = this.dynamic_data_source ?? ""

        await this.loadDataSource();
        await this.loadControlItems();
    }
};
</script>

<style lang="scss">
.form-checkbox-field {
    margin-bottom: 16px;
}
.custom-input-details {
    margin-top: 4px;
    font-size: 12px;
    line-height: 16px;
    color: rgba(0, 0, 0, 0.6);
}
.custom-input-details--error {
    color: rgb(var(--v-theme-error));
}
</style>
