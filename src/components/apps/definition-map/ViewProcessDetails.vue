<template>
    <div v-if="onLoad">
        <!-- Mega Process -->
        <div class="d-flex align-items-center">
            <v-card class="d-flex justify-center align-center pa-3 mb-3 details-title-card"
                elevation="10"
                style="background-color:rgb(var(--v-theme-primary), 0.2)"
            >
                <div class="d-flex flex-column justify-content-center align-items-center">
                    <h6 class="text-h6 font-weight-semibold text-center">
                        Mega<br>Process
                    </h6>
                </div>
            </v-card>
            <div class="line-with-dots d-flex">
                <div class="dot"></div>
                <div class="line flex-grow-1"></div>
                <div class="dot"></div>
            </div>
            <v-card class="d-flex align-center pa-3 mb-3"
                elevation="10"
                style="background-color:rgb(var(--v-theme-primary), 0.2)"
            >
                <h6 class="text-h6 font-weight-semibold text-center">{{ filteredProcess.name }}</h6>
                <!-- <div class="ml-auto">
                    <ProcessMenu
                        :size="20"
                        :type="'mega'"
                        :process="filteredProcess"
                        :enableEdit="enableEdit"
                        @add="addProcess"
                        @edit="editProcess"
                        @delete="deleteProcess"
                    />
                </div> -->
            </v-card>
        </div>
        <!-- major Process -->
        <div class="d-flex align-items-center" v-if="filteredProcess && filteredProcess.major_proc_list && filteredProcess.major_proc_list.length > 0">
            <v-card class="d-flex justify-center align-center pa-2 mb-3 details-title-card"
                elevation="10"
                style="border-radius: 20px !important; margin-bottom: 5px; border: 5px solid rgba(var(--v-theme-primary), 0.2);"
            >
                <div class="d-flex flex-column justify-content-center align-items-center">
                    <h6 class="text-h6 font-weight-semibold text-center">
                        Major<br>Process
                    </h6>
                </div>
            </v-card>
            <div class="line-with-dots d-flex">
                <div class="dot"></div>
                <div class="line flex-grow-1"></div>
                <div class="dot"></div>
            </div>
            <template v-for="(majorProc, index) in filteredProcess.major_proc_list" :key="index">
                <v-card 
                    class="d-flex align-center pa-2 mb-3 last-no-margin"
                    elevation="10"
                    style="border-radius: 20px !important; margin-bottom: 5px; border: 5px solid rgba(var(--v-theme-primary), 0.2);"
                >
                    <div class="d-flex flex-column justify-content-center align-items-center">
                        <h6 class="text-h6 font-weight-semibold text-center">{{ majorProc.name }}</h6>
                    </div>
                    <!-- <div class="ml-auto">
                        <ProcessMenu
                            :size="20"
                            :type="'major'"
                            :process="majorProc"
                            :enableEdit="enableEdit"
                            @add="addProcess"
                            @edit="editProcess"
                            @delete="deleteProcess"
                        />
                    </div> -->
                </v-card>
            </template>
        </div>

        <!-- sub Process -->
        <div class="d-flex align-items-center" v-if="filteredProcess && filteredProcess.major_proc_list && filteredProcess.major_proc_list.some(proc => proc.sub_proc_list && proc.sub_proc_list.length > 0)">
            <v-card class="d-flex justify-center align-center pa-3 mb-3 bg-white details-title-card"
                elevation="10"
            >
                <div class="justify-content-center align-items-center">
                    <h6 class="text-h6 font-weight-semibold text-center">
                        Sub<br>Process
                    </h6>
                </div>
            </v-card>
            <div class="line-with-dots d-flex">
                <div class="dot"></div>
                <div class="line flex-grow-1"></div>
                <div class="dot"></div>
            </div>
            <template v-for="(subProcRow, subIndex) in filteredProcess.major_proc_list" :key="subIndex">
                <v-col class="ma-0 pa-0 last-no-margin">
                    <template v-for="(subProc, index) in subProcRow.sub_proc_list" :key="`sub-${subIndex}-${index}`">
                        <v-card 
                            class="d-flex align-center pa-3 mb-3 bg-white"
                            elevation="10"
                            style="border-radius: 10px !important; cursor: pointer;"
                            @click="viewProcess(subProc)"
                        >
                            <div class="d-flex flex-column justify-content-center align-items-center">
                                <h6 class="text-h6 font-weight-semibold text-center">{{ subProc.name }}</h6>
                            </div>
                            <!-- <div class="ml-auto">
                                <ProcessMenu
                                    :size="20"
                                    :type="'sub'"
                                    :process="subProc"
                                    :enableEdit="enableEdit"
                                    @add="addProcess"
                                    @edit="editProcess"
                                    @delete="deleteProcess"
                                />
                            </div> -->
                        </v-card>
                    </template>
                </v-col>
            </template>
        </div>
    </div>
</template>

<script>
import ProcessMenu from './ProcessMenu.vue';
import BackendFactory from '@/components/api/BackendFactory';

export default {
    components: {
        ProcessMenu
    },
    props: {
        value: Object,
        enableEdit: Boolean,
    },
    data() {
        return {
            processPath: null, // 라우트 파라미터에서 받아온 process ID
            filteredProcess: {
                id: '',
                name: '',
                major_proc_list: []
            },
            onLoad: false,
        };
    },
    created() {
        this.init(this.$route.params);
    },
    watch: {
        value(newVal) {
            if (newVal && newVal.mega_proc_list && newVal.mega_proc_list.length > 0) {
                const process = newVal.mega_proc_list.find(process => process.name === this.processPath);
                if (process) {
                    this.filteredProcess = process;
                }
            }
        },
    },
    methods: {
        init(obj) {
            var me = this;
            me.$try({
                action: async () => {
                    me.onLoad = false;
                    me.processPath = obj.id;
                    if (me.value && me.value.mega_proc_list && me.value.mega_proc_list.length > 0) {
                        const process = me.value.mega_proc_list.find(process => process.name === me.processPath);
                        if (process) {
                            me.filteredProcess = process;
                        }
                    }
                    me.onLoad = true;
                }
            })
        },
        addProcess(newProcess, type, selectedProcessId) {
            if (type === 'mega') {
                // 'mega' 프로세스에 'major' 프로세스 추가
                if (!this.filteredProcess.major_proc_list) {
                    this.filteredProcess.major_proc_list = [];
                }
                this.filteredProcess.major_proc_list.push({
                    id: newProcess.id,
                    name: newProcess.name,
                    sub_proc_list: [] // 새로운 'major' 프로세스에는 초기화된 'sub_proc_list' 포함
                });
            } else if (type === 'major') {
                // 'major' 프로세스에 'sub' 프로세스 추가
                // selectedProcessId를 사용하여 현재 선택된 'major' 프로세스를 찾습니다.
                const majorProc = this.filteredProcess.major_proc_list.find(major => major.name === selectedProcessId);
                if (majorProc) {
                    if (!majorProc.sub_proc_list) {
                        majorProc.sub_proc_list = [];
                    }
                    majorProc.sub_proc_list.push({
                        id: newProcess.id,
                        label: newProcess.name
                    });
                } else {
                    console.error('Major process not found for the given selectedProcessId');
                }
            }
        },
        editProcess(process, type, selectedProcessId) {
            if (type === 'mega') {
                // this.processId를 사용하여 현재 선택된 Mega Process를 찾습니다.
                let targetMega = this.value.mega_proc_list.find(mega => mega.id === selectedProcessId);
                if (targetMega) {
                    // 찾은 객체를 process 객체의 값으로 업데이트합니다.
                    targetMega.id = process.id;
                    targetMega.name = process.name;
                    this.processPath = process.name;
                }
            } else if (type === 'major') {
                // Major Process 수정 로직
                this.value.mega_proc_list.forEach(megaProc => {
                    let targetMajor = megaProc.major_proc_list.find(major => major.id === selectedProcessId);
                    if (targetMajor) {
                        targetMajor.id = process.id;
                        targetMajor.name = process.name;
                    }
                });
            } else if (type === 'sub') {
                // Sub Process 수정 로직
                this.value.mega_proc_list.forEach(megaProc => {
                    megaProc.major_proc_list.forEach(majorProc => {
                        let targetSub = majorProc.sub_proc_list.find(sub => sub.id === selectedProcessId);
                        if (targetSub) {
                            targetSub.id = process.id;
                            targetSub.name = process.name;
                        }
                    });
                });
            }
        },
        deleteProcess(type, selectedProcessId) {
            if (type === 'mega') {
                // 'mega' 타입 프로세스 삭제
                this.value.mega_proc_list = this.value.mega_proc_list.filter(proc => proc.id !== selectedProcessId);
            } else if (type === 'major') {
                // 'major' 타입 프로세스 삭제
                this.value.mega_proc_list.forEach(megaProc => {
                    megaProc.major_proc_list = megaProc.major_proc_list.filter(major => major.id !== selectedProcessId);
                });
            } else if (type === 'sub') {
                // 'sub' 타입 프로세스 삭제
                this.value.mega_proc_list.forEach(megaProc => {
                    megaProc.major_proc_list.forEach(majorProc => {
                        majorProc.sub_proc_list = majorProc.sub_proc_list.filter(sub => sub.id !== selectedProcessId);
                    });
                });
            }
        },
        viewProcess(process) {
            this.$router.push(`/definition-map/sub/${process.id}`)
        },
    },
}
</script>

<style>
.details-title-card {
    border-radius: 10px;
    width:150px;
    flex-shrink: 0;
}
.text-h6 {
    text-align: center !important;
}

.last-no-margin:not(:last-child) {
    margin-right: 10px !important;
}

.line-with-dots {
    display: flex;
    align-items: center;
    margin-top:-1%;
}

.dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: black;
    opacity: 0.5;
}

.line {
    width: 30px;
    flex-grow: 0.5; /* 선이 남은 공간을 모두 차지하도록 설정 */
    border-top: 2px dotted black; /* 점선 생성 */
    height: 2px; /* 선의 높이 설정 */
}
</style>