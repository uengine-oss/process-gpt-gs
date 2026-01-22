<template>
    <v-card flat>
        <div v-if="foldedbtn">
            <v-btn block @click="foldedbtn = false" style="background: lightgrey; font-size: large;">
                <Icons :icon="'ai-edit-spark'"  style="margin-right: 5px;"/> AI Retrieval
            </v-btn>
            <v-progress-linear
                v-if="loading"
                color="deep-purple-accent-4"
                indeterminate
                rounded
                height="6"
            ></v-progress-linear>
        </div>
        <div v-else>  
            <v-card>
                <v-card-text style="padding: 10px;">
                    <div style="display: flex; justify-content: center; align-items: flex-start; height: 20px;">
                        <v-btn @click="foldedbtn = true" block style="align-items: start; height: fit-content;"> <v-icon>mdi-chevron-down</v-icon></v-btn>
                    </div>
                    <v-textarea
                        hide-details
                        v-model="queryResponse"
                        auto-grow
                        readonly
                        variant="solo-filled"
                    ></v-textarea>
                    <v-progress-linear
                        v-if="loading"
                        color="deep-purple-accent-4"
                        indeterminate
                        rounded
                        height="6"
                    ></v-progress-linear>
                    <div class="chips-container" style="margin-top: 5px;">
                        <v-chip
                            v-for="(source, index) in querySources"
                            :key="index"
                            variant="outlined"
                            size="x-small"
                            text-color="primary"
                            style="margin-bottom: 1px;">
                            <v-icon start icon="mdi-label" x-small></v-icon> {{ source.file_name }}
                        </v-chip>
                    </div>
                </v-card-text>
            </v-card>
        </div>
    </v-card>
</template>

<script>
import { Icon } from '@iconify/vue';
import GPTMemento from '../../utils/GPTMemento'

export default {
    name: 'RetrievalBox',
    props: {
        message: String,
    },
    components: {Icon},
    data: function () {
        return {
            retrievalJS: null,
            foldedbtn: true,      
            loading: false,   
            
            queryData: null,
            retrievalData: null,
        };
    },
    watch: {
        "message":function(newVal, oldVal){
            if(newVal) {
                // this.query(newVal)
                this.queryData = newVal
            }
        }
    },
    computed:{
        queryResponse(){
            if(this.queryData && this.queryData.response) return this.queryData.response
            return ''
        },
        querySources() {
            if (!this.queryData || !this.queryData.metadata) return {};
            const unique = {};
            const sources = Object.values(this.queryData.metadata).filter(obj => {
                if (!unique[obj.file_path]) {
                    unique[obj.file_path] = true;
                    return true;
                }
            });
            return sources;
        }
    },
    created(){
    //    this.retrievalJS = new GPTMemento();
    },
    methods: {
        // async query(str){
        //     this.loading = true
        //     this.queryData = await this.retrievalJS.query(str)
        //     this.loading = false
        // },
        // async retrieval(str){
        //     this.loading = true
        //     this.retrievalData = await this.retrievalJS.retrieval(str)
        //     this.loading = false
        // },
    }
};
</script>


<style>
.my-dense-btn {
    height: 30px; /* 원하는 높이로 조정 */
    min-height: 30px; /* 버튼의 최소 높이도 조정하여 일관성 유지 */
}
</style>

<style scoped>
.chips-container {
  display: flex;
  flex-wrap: wrap; /* 필요한 경우 줄 바꿈 */
  align-items: center; /* 수직 중앙 정렬 */
}
</style>