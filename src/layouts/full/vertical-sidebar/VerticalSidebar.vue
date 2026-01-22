<template>
    <v-btn icon
        v-if="globalIsMobile.value"
        @click.stop="customizer.SET_SIDEBAR_DRAWER"
        class="mobile-side-bar-btn"
        size="40"
        color="primary"
    >
        <Icons :icon="'list-bold-duotone'"/>
    </v-btn>
    <v-badge
        v-if="notiCount > 0"
        class="mobile-side-bar-btn"
        :content="notiCount"
        :model-value="notiCount > 0"
        color="error"
        location="top end"
        offset-x="-40"
        offset-y="-37"
    ></v-badge>
    <v-navigation-drawer
        left
        v-model="customizer.Sidebar_drawer"
        rail-width="70"
        :mobile-breakpoint="1279"
        app
        class="leftSidebar ml-sm-5 mt-sm-5 bg-containerBg"
        elevation="10"
        :rail="customizer.mini_sidebar"
        expand-on-hover
        width="275"
    >
        <div class="d-flex align-center pa-4 pb-2 ma-0 is-sidebar-pc" >
            <Logo :style="logoPadding"/>
            <v-spacer></v-spacer>
            <v-tooltip v-if="!pal" :text="$t('processDefinitionMap.title')"
                location="bottom"
            >
                <template v-slot:activator="{ props }">
                    <v-btn icon variant="text" density="comfortable"
                        v-bind="props"
                        class="text-medium-emphasis"
                        :to="'/definition-map'"
                    >
                        <Icons :icon="'write'" />
                    </v-btn>
                </template>
            </v-tooltip>
        </div>
        <div class="pa-4 is-sidebar-mobile"
            :class="{ 'mobile-no-padding-bottom': globalIsMobile.value }"
        >
            <v-row class="ma-0 pa-0" align="center">
                <Logo />
                <v-spacer></v-spacer>
                <Icons @click.stop="customizer.SET_SIDEBAR_DRAWER"
                    style="margin-top: -8px; cursor: pointer;"
                    :icon="'close'" :size="16"
                />
            </v-row>
        </div>
        <!-- ---------------------------------------------- -->
        <!---Navigation -->
        <!-- ---------------------------------------------- -->
        <div class="scrollnavbar bg-containerBg overflow-y-auto">
            <v-list class="py-4 px-4 bg-containerBg pt-0 pb-0 pr-2 pl-2"
                :class="globalIsMobile.value ? 'pr-4' : ''"
                style="display: flex;
                    flex-direction: column;
                    flex: 1 1 auto;
                    overflow: hidden;"
            >
                <!---Menu Loop -->
                <template v-for="item in sidebarItem" :key="item.title">
                    <!---Item Sub Header -->
                    <NavGroup v-if="item.header && !item.disable" :item="item" :key="item.title" />
                    <!---If Has Child -->
                    <NavCollapse v-else-if="item.children && !item.disable" class="leftPadding" :item="item" :level="0" />
                    <!---Single Item-->
                    <NavItem v-else-if="!item.disable" class="leftPadding" :item="item" />
                    <!---End Single Item-->
                </template>
                <v-btn variant="text"
                    class="text-medium-emphasis d-flex align-center"
                    :to="'/definition-map'"
                    v-if="pal"
                >
                    <Icons :icon="'write'" class="mr-2" />
                    <span>{{ $t('processDefinitionMap.title') }}</span>
                </v-btn>
                <VerticalHeader v-if="globalIsMobile.value" @update-noti-count="updateNotiCount" />

                <!-- 프로젝트 타이틀 + 목록 -->
                <!-- <div v-if="isShowProject" class="mb-4">
                    <div  class="d-flex align-center">
                        <div style="font-size:14px;" class="text-medium-emphasis cp-menu mt-0 ml-2">
                            {{ $t('VerticalSidebar.projectList') }}
                        </div>
                        <v-tooltip v-if="isAdmin" location="bottom" :text="$t('VerticalSidebar.addProject')">
                            <template v-slot:activator="{ props }">
                                <div class="pl-2">
                                    <Icons 
                                        @click="openNewProject()"
                                        v-bind="props"
                                        :icon="'plus'"
                                        :size="12"
                                        :color="'#808080'"
                                        style="cursor: pointer;"
                                    />
                                </div>
                            </template>
                        </v-tooltip>
                    </div>
                    <v-col class="pa-0">
                        <ProjectList/>
                    </v-col>
                </div> -->
                
                <!-- 인스턴스 타이틀 + 목록 -->
                <v-col v-if="isShowInstances" class="pa-0 mb-4">
                    <div v-if="!pal && !JMS" class="d-flex align-center">
                        <div style="font-size:14px;" class="text-medium-emphasis cp-menu mt-0 ml-2">
                            {{ $t('VerticalSidebar.instanceList') }}
                        </div>
                        <div v-for="item in instanceItem" :key="item.title">
                            <v-tooltip location="bottom" :text="$t(item.title)">
                                <template v-slot:activator="{ props }">
                                    <div class="pl-2 pt-1">
                                        <Icons @click="navigateTo(item.to)" v-bind="props"
                                            :icon="item.icon"
                                            :size="16"
                                            :color="'#808080'"
                                            style="cursor: pointer; width: 16px; height: 16px;"
                                        />
                                    </div>
                                </template>
                            </v-tooltip>
                        </div>
                    </div>

                    <ProcessInstanceList
                        @update:instanceLists="handleInstanceListUpdate" 
                    />
                </v-col>


                <!-- 에이전트 타이틀 + 목록 (uEngine 모드에서는 숨김) -->
                <div v-if="mode !== 'uEngine'" class="mb-4">
                    <v-row class="align-center pa-0 ma-0">
                        <div style="font-size:14px;" class="text-medium-emphasis cp-menu mt-0 ml-2">
                            {{ $t('VerticalSidebar.agentList') }}
                        </div>
                        <div v-if="isAdmin" v-for="item in organizationItem" :key="item.title">
                            <v-tooltip v-if="item.icon && !item.disable" location="bottom" :text="$t(item.title)">
                                <template v-slot:activator="{ props }">
                                    <Icons @click="navigateTo(item.to)" v-bind="props"
                                        class="ml-2"
                                        :icon="item.icon"
                                        :size="item.size || 20"
                                        :color="'#808080'"
                                        style="cursor: pointer;"
                                    />
                                </template>
                            </v-tooltip>
                        </div>
                    </v-row>
                    <v-col class="pa-0">
                        <AgentList/>
                    </v-col>
                </div>
              
                <!-- 정의관리 타이틀 + 목록 (NavCollapse 컴포넌트 내부의 dropDown 폴더 내부 index.vue 컴포넌트에 실제 리스트 UI가 있음) -->
                <v-col class="pa-0">
                    <!-- definition menu item -->
                    <template v-for="(item, index) in definitionItem" :key="item.title">
                        <!-- Item Sub Header -->
                        <div v-if="item.header && index === 0"
                            style="font-size:14px;"
                            class="text-medium-emphasis cp-menu mt-3 ml-2"
                        >{{ $t(item.header) }}</div>
                        <v-row v-if="item.header && !item.disable"
                            class="pa-0 ma-0" 
                        >
                            <template v-for="subItem in definitionItem" :key="subItem.title">
                                <v-tooltip v-if="subItem.title" location="bottom" :text="$t(subItem.title)">
                                    <template v-slot:activator="{ props }">
                                        <v-btn
                                            v-if="!subItem.header && !subItem.disable"
                                            @click="navigateTo(subItem.to)"
                                            v-bind="props"
                                            icon variant="text" 
                                            class="text-medium-emphasis cp-menu"
                                            density="comfortable"
                                        >
                                            <Icons :icon="subItem.icon" :size="subItem.size ? subItem.size : 20" />   
                                        </v-btn>
                                    </template>
                                </v-tooltip>
                            </template>
                        </v-row>
                        <NavCollapse v-else-if="item.children && !item.disable" class="leftPadding" :item="item" :level="0" />
                    </template>
                </v-col>
                <v-col class="pa-0">
                    <ExpandableList 
                        v-if="definitionList && definitionList.children"
                        :items="definitionList.children" 
                        :limit="10"
                        @expanded="onDefinitionsExpanded"
                        @collapsed="onDefinitionsCollapsed"
                    >
                        <template #items="{ displayedItems }">
                            <NavCollapse v-for="(definition, i) in displayedItems" :key="i"
                                :item="definition" 
                                class="leftPadding"
                                @update:item="(def) => (displayedItems[i] = def)" 
                                :level="0" 
                                :type="'definition-list'" 
                            />
                        </template>
                    </ExpandableList>
                </v-col>
            </v-list>
            <Footer class="mt-2" />
        </div>
        <div class="pa-4 px-4 bg-containerBg">
            <ExtraBox />
        </div>
    </v-navigation-drawer>

    <v-dialog v-model="isNewProjectOpen" max-width="400" class="delete-input-details" persistent>
        <ProjectCreationForm  @close="closeNewProject" @save="createNewProject" />
    </v-dialog>


    <v-dialog v-model="isOpen" max-width="400" class="delete-input-details">
        <v-card class="pa-4 pt-2">
            <v-row class="ma-0 pa-0 pb-2" align="center">
                <v-card-title class="pa-0">{{ $t('VerticalSidebar.downloadDefinitionList') }}</v-card-title>
                <v-spacer></v-spacer>
                <v-btn @click="closeDownloadDefinitionList()" icon variant="text" density="comfortable">
                    <Icons :icon="'close'" :size="16" />
                </v-btn>
            </v-row>
            <v-text-field
                v-model="release"
                :label="$t('VerticalSidebar.saveFileName')"
                required
                class="pb-2"
            ></v-text-field>
            <v-row class="pa-0 pa-4">
                <v-spacer></v-spacer>
                <v-btn @click="downloadDefinitionList(release)" color="primary" rounded>{{ $t('VerticalSidebar.save') }}</v-btn>
            </v-row>
        </v-card>
    </v-dialog>
</template>

<script>
import ProcessInstanceList from '@/components/ui/ProcessInstanceList.vue';
import ProjectList from '@/components/ui/ProjectList.vue';
import ProjectCreationForm from '@/components/apps/todolist/ProjectCreationForm.vue';
import AgentList from '@/components/ui/AgentList.vue';
import ExpandableList from '@/components/ui/ExpandableList.vue';

import { useCustomizerStore } from '@/stores/customizer';

import Logo from '../logo/Logo.vue';
import NavCollapse from './NavCollapse/NavCollapse.vue';
import NavGroup from './NavGroup/index.vue';
import NavItem from './NavItem/index.vue';
import ExtraBox from './extrabox/ExtraBox.vue';
import BackendFactory from '@/components/api/BackendFactory';

import VerticalHeader from '../vertical-header/VerticalHeader.vue';

import Footer from '../Footer.vue'

const backend = BackendFactory.createBackend();

export default {
    components: {
        ProcessInstanceList,
        ProjectList,
        ProjectCreationForm,
        AgentList,
        ExpandableList,
        Logo,
        NavCollapse,
        NavGroup,
        NavItem,
        ExtraBox,
        VerticalHeader,
        Footer
    },
    setup() {
        const customizer = useCustomizerStore();
        return {
            customizer
        };
    },
    data: () => ({
        sidebarItem: [],
        instanceItem: [],
        organizationItem: [],
        definitionItem: [],
        definitionList: null,
        logoPadding: '',
        instanceLists: [],
        isOpen: false,
        startDateMenu: false,
        dueDateMenu: false,
        newProjectInfo: {
            name: '',
            startDate: null,
            dueDate: null,
        },
        isNewProjectOpen: false,
        deletedDefinitionList: [],
        notiCount: 0,
    }),
    computed: {
        JMS() {
            return window.$jms;
        },
        mode() {
            return window.$mode;
        },
        pal() {
            return window.$pal;
        },
        isShowInstances() {
            if (!this.pal && !this.JMS) {
                return true;
            }
            return false;
        },
        isShowProject(){
            return true;
        },
        isAdmin() {
            const isAdmin = localStorage.getItem('isAdmin') == 'true';
            return isAdmin;
        },
    },
    async mounted() {
        await this.loadSidebar(this.isAdmin);

        this.EventBus.on('definitions-updated', async () => {
            await this.getDefinitionList();
        });
        if (window.$mode === 'uEngine') {
            this.logoPadding = 'padding:6px'
        }

        window.addEventListener('localStorageChange', (event) => {
            if (event.detail.key === 'isAdmin') {
                let isAdmin = false;
                if (event.detail.value === 'true' || event.detail.value === true) {
                    isAdmin = true;
                }
                this.loadSidebar(isAdmin);
            }
        });
    },
    methods: {
        updateNotiCount(count) {
            this.notiCount = count;
        },
        async loadSidebar(isAdmin) {
            if (isAdmin) {
                this.definitionItem = [
                    {
                        header: 'definitionManagement.title',
                        disable: false
                    },
                    {
                        title: 'processDefinition.title',
                        icon: 'sidebarProcess',
                        BgColor: 'primary',
                        to: '/definitions/chat',
                        disable: false
                    },
                    {
                        title: 'uiDefinition.title',
                        icon: 'document',
                        BgColor: 'primary',
                        to: '/ui-definitions/chat',
                        disable: true
                    },
                    // {
                    //     title: 'BSCard.title',
                    //     icon: 'compass',
                    //     BgColor: 'primary',
                    //     to: '/bscard',
                    //     disable: true
                    // },
                    {
                        title: 'systemDefinition.title',
                        icon: 'server-line-duotone',
                        BgColor: 'primary',
                        to: '/system',
                        disable: true
                    },
                    {
                        title: 'definitionManagement.defaultForm',
                        icon: 'formList',
                        BgColor: 'primary',
                        disable: true,
                        to: '/ui-definitions/defaultform',
                        size: 24
                    },
                    {
                        title: 'definitionManagement.upload',
                        icon: 'upload',
                        BgColor: 'primary',
                        to: function() {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = '.zip';
                            input.onchange = (event) => {
                                const file = event.target.files[0];
                                if (file) {
                                    backend.uploadDefinition(file);
                                }
                            };
                            input.click();
                        },
                        disable: true
                    },
                    {
                        title: 'definitionManagement.release',
                        icon: 'download',
                        BgColor: 'primary',
                        disable: true,
                        to: this.openDialog
                    },
                ];
                
                if (this.mode === 'ProcessGPT') {
                    this.definitionItem = this.definitionItem.filter((item) => 
                        item.title !== 'uiDefinition.title' && 
                        item.title !== 'systemDefinition.title' &&
                        item.title !== 'definitionManagement.upload' &&
                        item.title !== 'definitionManagement.release'
                    );
                }
                this.getDefinitionList();
            }

            if (!this.pal && !this.JMS) {
                // 사이드바에서 완료된 인스턴스 목록 보기 버튼 
                this.instanceItem = [
                    {
                        title: 'definitionManagement.completedList',
                        icon: 'search',
                        BgColor: 'primary',
                        disable: true,
                        to: '/list-pages/completed',
                        size: 20
                    },
                ];
                this.organizationItem = [
                    {
                        title: 'organizationChartDefinition.title',
                        icon: 'plus',
                        BgColor: 'primary',
                        to: '/organization',
                        disable: false,
                        size: 12
                    },
                ];
            }

            if (!this.JMS) {
                this.definitionItem.forEach((item) => {
                    if (item.disable) {
                        item.disable = false;
                    }
                });
            }
            
            // 완료된 인스턴스가 있는지 직접 확인
            await this.checkCompletedInstances();
        },
        async checkCompletedInstances() {
            try {
                // COMPLETED 상태의 인스턴스가 있는지 직접 확인
                const completedList = await backend.getInstanceListByStatus(['COMPLETED'], {
                    range: { from: 0, to: 0 } // 1개만 가져와서 존재 여부만 확인
                });
                
                const hasCompleted = completedList && completedList.length > 0;
                
                // 버튼 상태 즉시 업데이트
                if (this.instanceItem && this.instanceItem.length > 0) {
                    this.instanceItem[0].disable = !hasCompleted;
                }
            } catch (error) {
                // 오류 시 기본적으로 숨김
                if (this.instanceItem && this.instanceItem.length > 0) {
                    this.instanceItem[0].disable = true;
                }
            }
        },
        openCompletedList(){
            this.$router.push('/list-pages/completed');
        },
        openNewProject(){
            this.isNewProjectOpen = true;
        },
        async createNewProject(value){
            var me = this
            me.$try({
                context: me,
                async action() {
                    await backend.putProject({
                        name: value.name,
                        startDate: value.startDate,
                        dueDate: value.dueDate,
                        endDate: null,
                        status: "NEW",
                        createdDate: new Date().toISOString(),
                        userId: localStorage.getItem('email'),
                    });
                    me.closeNewProject();
                },
            })
        },
        closeNewProject(){
            this.isNewProjectOpen = false;
        },
        openDialog() {
            this.isOpen = true;
        },
        closeDownloadDefinitionList() {
            this.isOpen = false;
        },
        async downloadDefinitionList(releaseName) {
            await backend.releaseVersion(releaseName);
            this.closeDownloadDefinitionList()
        },
        async getChild(subitem) {
            let res = await backend.listDefinition(subitem.path);
            let menu = [];
            const me = this;

            if (Array.isArray(res)) {
                res.forEach((el) => {
                    var obj = {
                        title: el.name.split('.')[0],
                        type: el.name.split('.')[1],
                        BgColor: 'primary'
                    };

                    if (el.directory) {                 
                        obj.directory = true;
                        obj.children = [];
                        obj.path = el.path;
                        me.getChild(obj);
                    } else {
                        if (el.name.split('.')[1] == 'form') {
                            obj.to = `/ui-definitions/${el.path.split('.')[0]}`;
                        } else {
                            obj.to = `/definitions/${el.path.split('.')[0]}`;
                        }
                    }
                    menu.push(obj);
                });
            }
            subitem.children = menu;
        },
        async getDefinitionList() {
            const me = this
            const list = await backend.listDefinition();
            if (list && list.length > 0) {
                var menu = {
                    children: []
                };
                var deletedMenu = {
                    children: []
                };
                list.forEach((item) => {
                    if(!item.isDeleted){
                        if (item.directory) {
                            if (item.name != 'instances'  || item.name != 'archive') {
                                var obj = {
                                    title: item.name,
                                    icon: 'outline-folder',
                                    // to: `/definitions/${item.definition.processDefinitionId}`,
                                    directory: true,
                                    BgColor: 'primary',
                                    path: item.path
                                };
                                me.getChild(obj)
                                menu.children.push(obj);
                            }
                        } else if (item) {
                            var obj = {};
                            if (item.path && item.path.includes('.bpmn')) {
                                obj = {
                                    title: item.name,
                                    to: `/definitions/${item.path.split('.')[0]}`,
                                    BgColor: 'primary',
                                    type: 'bpmn'
                                };
                                menu.children.push(obj);
                            } else if (item.path && item.path.includes('.form')) {
                                obj = {
                                    title: item.name,
                                    to: `/ui-definitions/${item.path.split('.')[0]}`,
                                    BgColor: 'primary',
                                    type: 'form'
                                };
                                menu.children.push(obj);
                            } else if (item.definition) {
                                obj = {
                                    title: item.definition.processDefinitionName,
                                    to: `/definitions/${item.definition.processDefinitionId}`,
                                    BgColor: 'primary',
                                    type: 'bpmn'
                                };
                                menu.children.push(obj);
                            } else if (item.type && item.type === 'dmn') {
                                obj = {
                                    title: item.name,
                                    to: `/dmn/${item.id}`,
                                    BgColor: 'primary',
                                    type: 'dmn'
                                };
                                menu.children.push(obj);
                            }
                        }
                    } else {
                        if (item.directory) {
                            if (item.name != 'instances'  || item.name != 'archive') {
                                var obj = {
                                    title: item.name,
                                    icon: 'outline-folder',
                                    // to: `/definitions/${item.definition.processDefinitionId}`,
                                    directory: true,
                                    BgColor: 'primary',
                                    path: item.path
                                };
                                me.getChild(obj)
                                menu.children.push(obj);
                            }
                        } else if (item) {
                            var obj = {};
                            if (item.path && item.path.includes('.bpmn')) {
                                obj = {
                                    title: item.name,
                                    to: `/definitions/${item.path.split('.')[0]}`,
                                    BgColor: 'primary',
                                    type: 'bpmn'
                                };
                                deletedMenu.children.push(obj);
                            } else if (item.path && item.path.includes('.form')) {
                                obj = {
                                    title: item.name,
                                    to: `/ui-definitions/${item.path.split('.')[0]}`,
                                    BgColor: 'primary',
                                    type: 'form'
                                };
                                deletedMenu.children.push(obj);
                            } else if (item.definition) {
                                obj = {
                                    title: item.definition.processDefinitionName,
                                    to: `/definitions/${item.definition.processDefinitionId}`,
                                    BgColor: 'primary',
                                    type: 'bpmn'
                                };
                                deletedMenu.children.push(obj);
                            }
                        }
                    }
                });
                
                // title이 있는 항목들만 필터링
                menu.children = menu.children.filter(item => item && item.title && item.title.trim().length > 0);
                deletedMenu.children = deletedMenu.children.filter(item => item && item.title && item.title.trim().length > 0);
                
                this.definitionList = this.sortProjectList(menu);
                this.deletedDefinitionList = this.sortProjectList(deletedMenu);
            }
        },
        sortProjectList(list) {
            // list나 list.children이 없는 경우 안전하게 반환
            if (!list || !list.children || !Array.isArray(list.children)) {
                return list || { children: [] };
            }

            const getCharType = (char) => {
                if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(char)) return 1; // 한글
                if (/[a-zA-Z]/.test(char)) return 2; // 영어
                if (/[0-9]/.test(char)) return 3; // 숫자
                return 4; // 기타
            };

            // children 배열을 정렬하고 원본 객체 구조를 유지
            list.children.sort((a, b) => {
                // title이 없는 경우 안전하게 처리
                if (!a || !a.title || !b || !b.title) {
                    if (!a || !a.title) return 1;  // a를 뒤로
                    if (!b || !b.title) return -1; // b를 뒤로
                    return 0;
                }

                // title이 빈 문자열인 경우도 처리
                if (a.title.length === 0 || b.title.length === 0) {
                    if (a.title.length === 0) return 1;  // a를 뒤로
                    if (b.title.length === 0) return -1; // b를 뒤로
                    return 0;
                }

                const titleA = a.title.charAt(0);
                const titleB = b.title.charAt(0);
                
                const typeA = getCharType(titleA);
                const typeB = getCharType(titleB);

                if (typeA !== typeB) {
                    return typeA - typeB;
                }
                
                return a.title.localeCompare(b.title, 'ko-KR');
            });
            
            // 원본 list 객체를 반환 (children이 정렬된 상태)
            return list;
        },
        navigateTo(path) {
            if (typeof path === 'function') {
                path();
            } else {
                this.$router.push(path);
            }
        },
        handleInstanceListUpdate(instanceList) {
            this.instanceLists = instanceList;
        },
        onDefinitionsExpanded() {
            // 확장 시 필요한 로직이 있다면 여기에 추가
        },
        onDefinitionsCollapsed() {
            // 축소 시 필요한 로직이 있다면 여기에 추가
        }
    }
};
</script>

<style scoped>
.mobile-no-padding-bottom {
    padding-bottom: 0px !important;
}
</style>
