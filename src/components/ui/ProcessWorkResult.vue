<template>
    <div>
        <v-row class="ma-0 pa-0">
            <v-col cols="12" md="6" class="pa-4 pt-0 pl-0" v-if="!(pendingActivities.length > 0 && completedActivities.length == 0)">
                <v-card class="mb-0 h-100 process-work-result-card" elevation="2">
                    <v-card-text class="pa-4">
                        <div class="process-work-result-header">
                            <div class="process-work-result-title-section">
                                <v-icon class="mr-2">mdi-check-circle</v-icon>
                                <h4 class="text-h6 mb-0">{{ $t('ProcessWorkResult.completedActivities') }}</h4>
                            </div>
                            <div class="process-work-result-user-section">
                                <template v-for="(activity, index) in completedActivities" :key="'completed-' + index">
                                    <template v-if="getUserInfoForCompleted(activity)">
                                        <div class="mr-2" style="width: 24px;">
                                            <v-img 
                                                :src="getUserInfoForCompleted(activity).profile || '/images/defaultUser.png'"
                                                alt="profile"
                                                width="24"
                                                height="24"
                                                style="border-radius: 50%;"
                                            />
                                        </div>
                                        <span class="body-text-2 text-medium-emphasis">{{ getUserInfoForCompleted(activity).username }}</span>
                                    </template>
                                    <template v-else-if="isLoadingUsers">
                                        <div class="mr-2" style="width: 24px;">
                                            <v-progress-circular 
                                                indeterminate 
                                                color="primary" 
                                                size="16"
                                                width="2"
                                            ></v-progress-circular>
                                        </div>
                                        <span class="body-text-2 text-medium-emphasis">{{ $t('ProcessWorkResult.loadingCompletedUserInfo') }}</span>
                                    </template>
                                </template>
                            </div>
                        </div>
                        <v-list dense class="pa-0">
                            <v-list-item v-for="(activity, index) in completedActivities" :key="'completed-' + index" class="px-0">
                                <v-list-item-title class="font-weight-bold">{{ $t('ProcessWorkResult.activity') }}: {{ activity.completedActivityName }}</v-list-item-title>
                                <div style="color: #808080;">{{ activity.description }}</div>
                            </v-list-item>
                            <v-list-item v-if="completedActivities.length === 0" class="px-0">
                                <v-list-item-subtitle class="text-grey">{{ $t('ProcessWorkResult.noCompletedActivities') }}</v-list-item-subtitle>
                            </v-list-item>
                        </v-list>
                    </v-card-text>
                </v-card>
            </v-col>
            <v-col cols="12" md="6" class="pa-4 pt-0 pl-0" v-if="pendingActivities.length > 0">
                <v-card class="mb-0 h-100 process-work-result-card" elevation="2">
                    <v-card-text class="pa-4">
                        <div class="process-work-result-header">
                            <div class="process-work-result-title-section">
                                <v-icon class="mr-2">mdi-cancel</v-icon>
                                <h4 class="text-h6 mb-0">{{ $t('ProcessWorkResult.pendingActivities') }}</h4>
                            </div>
                            <div class="process-work-result-user-section">
                                <template v-for="(activity, index) in pendingActivities" :key="'pending-' + index">
                                    <template v-if="getUserInfoForCompleted(activity)">
                                        <div class="mr-2" style="width: 24px;">
                                            <v-img 
                                                :src="getUserInfoForCompleted(activity).profile || '/images/defaultUser.png'"
                                                alt="profile"
                                                width="24"
                                                height="24"
                                                style="border-radius: 50%;"
                                            />
                                        </div>
                                        <span class="body-text-2 text-medium-emphasis">{{ getUserInfoForCompleted(activity).username }}</span>
                                    </template>
                                    <template v-else-if="isLoadingUsers">
                                        <div class="mr-2" style="width: 24px;">
                                            <v-progress-circular 
                                                indeterminate 
                                                color="primary" 
                                                size="16"
                                                width="2"
                                            ></v-progress-circular>
                                        </div>
                                        <span class="body-text-2 text-medium-emphasis">{{ $t('ProcessWorkResult.loadingPendingUserInfo') }}</span>
                                    </template>
                                </template>
                            </div>
                        </div>
                        <v-list dense class="pa-0">
                            <v-list-item v-for="(activity, index) in pendingActivities" :key="'pending-' + index" class="px-0">
                                <v-list-item-title class="font-weight-bold">{{ $t('ProcessWorkResult.activity') }}: {{ activity.completedActivityName }}</v-list-item-title>
                                <div style="color: #808080;">{{ activity.description }}</div>
                            </v-list-item>
                        </v-list>
                    </v-card-text>
                </v-card>
            </v-col>
            <v-col cols="12" md="6" class="pa-4 pt-0 pl-0">
                <v-card class="h-100 process-work-result-card" elevation="2">
                    <v-card-text class="pa-4">
                        <div class="process-work-result-header">
                            <div class="process-work-result-title-section">
                                <v-icon class="mr-2">mdi-refresh</v-icon>
                                <h4 class="text-h6 mb-0">{{ $t('ProcessWorkResult.nextActivities') }}</h4>
                            </div>
                            <div class="process-work-result-user-section">
                                <template v-for="(activity, index) in nextActivities" :key="'next-' + index">
                                    <template v-if="getUserInfoForNext(activity)">
                                        <div class="mr-2" style="width: 24px;">
                                            <v-img 
                                                :src="getUserInfoForNext(activity).profile || '/images/defaultUser.png'"
                                                alt="profile"
                                                width="24"
                                                height="24"
                                                style="border-radius: 50%;"
                                            />
                                        </div>
                                        <span class="body-text-2 text-medium-emphasis">{{ getUserInfoForNext(activity).username }}</span>
                                    </template>
                                    <template v-else-if="isLoadingUsers">
                                        <div class="mr-2" style="width: 24px;">
                                            <v-progress-circular 
                                                indeterminate 
                                                color="primary" 
                                                size="16"
                                                width="2"
                                            ></v-progress-circular>
                                        </div>
                                        <span class="body-text-2 text-medium-emphasis">{{ $t('ProcessWorkResult.loadingAssigneeInfo') }}</span>
                                    </template>
                                </template>
                            </div>
                        </div>
                        <v-list dense class="pa-0">
                            <v-list-item v-for="(activity, index) in nextActivities" :key="'next-' + index" class="px-0">
                                <v-list-item-title class="font-weight-bold">{{ $t('ProcessWorkResult.activity') }}: {{ activity.nextActivityName }}</v-list-item-title>
                                <v-list-item-subtitle style="color: #808080;">{{ activity.description }}</v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item v-if="nextActivities.length === 0" class="px-0">
                                <v-list-item-subtitle class="text-grey">{{ $t('ProcessWorkResult.noNextActivities') }}</v-list-item-subtitle>
                            </v-list-item>
                        </v-list>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <div v-if="referenceInfo && referenceInfo.length > 0"
            class="pa-4 pt-0 pl-0"
        >
            <v-card 
                elevation="2"
                class="ma-0 pa-0"
            >
                <v-card-text class="ma-0 pa-4">
                    <div class="d-flex align-center">
                        <v-icon class="mr-2">mdi-clipboard-text</v-icon>
                        <h4 class="text-h6 mb-0">{{ $t('ProcessWorkResult.referenceInfo') }}</h4>
                    </div>
                    <v-list dense class="pa-0">
                        <v-list-item v-for="(info, index) in referenceInfo" :key="'ref-' + index" class="px-0">
                            <v-list-item-title class="font-weight-bold">{{ info.key }}</v-list-item-title>
                            <v-list-item-subtitle>{{ info.value }}</v-list-item-subtitle>
                        </v-list-item>
                    </v-list>
                </v-card-text>
            </v-card>
        </div>
    </div>
</template>

<script>
import BackendFactory from "@/components/api/BackendFactory";
const backend = BackendFactory.createBackend();

export default {
    props: {
        message: Object
    },
    data: () => ({
        resultJson: {},
        completedActivities: [],
        pendingActivities: [],
        nextActivities: [],
        referenceInfo: [],
        userList: [],
        isLoadingUsers: false,
        loadedUserInfo: {} // 로드된 사용자 정보 캐시
    }),
    mounted() {
        this.init();
    },
    methods: {
        init() {
            if (this.message && this.message.jsonContent) {
                if (typeof this.message.jsonContent == 'string') {
                    this.resultJson = JSON.parse(this.message.jsonContent);
                    if (this.resultJson.completedActivities && this.resultJson.completedActivities.length > 0) {
                        this.completedActivities = this.resultJson.completedActivities.filter(activity => activity.result == "DONE");
                        this.pendingActivities = this.resultJson.completedActivities.filter(activity => activity.result == "PENDING");
                    }
                    this.nextActivities = this.resultJson.nextActivities;
                    this.referenceInfo = this.resultJson.referenceInfo;
                } else {
                    this.resultJson = this.message.jsonContent;
                    if (this.resultJson.completedActivities && this.resultJson.completedActivities.length > 0) {
                        this.completedActivities = this.resultJson.completedActivities.filter(activity => activity.result == "DONE");
                        this.pendingActivities = this.resultJson.completedActivities.filter(activity => activity.result == "PENDING");
                    }
                    this.nextActivities = this.resultJson.nextActivities;
                    this.referenceInfo = this.resultJson.referenceInfo;
                }
            }
        },
        async loadUserList() {
            if (this.isLoadingUsers || this.userList.length > 0) {
                return; // 이미 로딩 중이거나 로드됨
            }
            
            try {
                this.isLoadingUsers = true;
                this.userList = await backend.getUserList({});
                this.$forceUpdate(); // UI 갱신
            } catch (error) {
                console.error('사용자 목록 로드 실패:', error);
            } finally {
                this.isLoadingUsers = false;
            }
        },
        getUserInfoById(userId) {
            if (!userId || !this.userList || this.userList.length === 0) {
                // 사용자 목록이 없으면 로드 시작
                if (!this.isLoadingUsers) {
                    this.loadUserList();
                }
                return null;
            }
            
            // 캐시에서 먼저 확인
            if (this.loadedUserInfo[userId]) {
                return this.loadedUserInfo[userId];
            }
            
            // 사용자 목록에서 찾기 (UUID, email 등 다양한 필드로 매칭)
            const foundUser = this.userList.find(user => 
                user.id === userId || 
                user.userId === userId || 
                user.email === userId ||
                user.uuid === userId
            );
            
            if (foundUser) {
                // 캐시에 저장
                this.loadedUserInfo[userId] = foundUser;
                return foundUser;
            }
            
            return null;
        },
        getUserInfoForCompleted(activity) {
            if (!activity || !activity.completedUserEmail) {
                return null;
            }
            return this.getUserInfoById(activity.completedUserEmail);
        },
        getUserInfoForNext(activity) {
            if (!activity || !activity.nextUserEmail) {
                return null;
            }
            return this.getUserInfoById(activity.nextUserEmail);
        }
    }
}
</script>

<style scoped>
/* 프로세스 작업 결과 카드 - 컨테이너 쿼리용 컨테이너 */
.process-work-result-card {
    container-type: inline-size;
    container-name: process-work-result-card;
}

/* 프로세스 작업 결과 헤더 - 제목과 사용자 정보를 담는 컨테이너 */
.process-work-result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

/* 프로세스 작업 결과 제목 섹션 - 아이콘과 제목 */
.process-work-result-title-section {
    display: flex;
    align-items: center;
}

/* 프로세스 작업 결과 사용자 섹션 - 프로필과 사용자명 */
.process-work-result-user-section {
    display: flex;
    align-items: center;
}

/* 카드 너비가 300px 이하일 때 세로 배치 */
@container process-work-result-card (max-width: 250px) {
    .process-work-result-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }
}
</style>