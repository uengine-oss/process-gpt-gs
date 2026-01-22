<template>
    <div style="height:100%; position: relative;">
        <!-- 검색 UI -->
        <div class="organization-chart-search-container">
            <v-row class="align-center flex-fill border border-borderColor header-search rounded-pill px-5 ma-0 pa-0">
                <Icons :icon="'magnifer-linear'" :size="22" />
                <v-text-field 
                    v-model="searchQuery" 
                    variant="plain" 
                    density="compact"
                    class="position-relative pt-0 ml-3 custom-placeholer-color" 
                    :placeholder="$t('OrganizationChart.searchByName')"
                    single-line 
                    hide-details
                    @input="onSearchInput"
                ></v-text-field>
            </v-row>
        </div>
        
        <!-- organization chart -->
        <div id="tree" ref="tree" style="width: 100% !important; height: 100% !important;"></div>
        
        <!-- Agent Badges Diagram -->
        <AgentBadgesDiagram 
            :show="showBadgesDiagram" 
            :agentData="selectedAgent" 
            @close="closeBadgesDiagram"
            @openEditDialog="handleAgentEditFromBadges"
        />
        
        <!-- dialogs -->
        <v-dialog v-model="teamDialog" max-width="500">
            <OrganizationTeamDialog 
                :dialogType="teamDialogType" 
                :editNode="editNode"
                @updateTeam="updateTeam"
                @closeDialog="closeTeamDialog"
            ></OrganizationTeamDialog>
        </v-dialog>
        <v-dialog 
            v-model="editDialog" 
            :max-width="isMobile ? '100vw' : 500"
            :fullscreen="isMobile"
        >
            <OrganizationEditDialog
                :dialogType="editDialogType"
                :editNode="editNode"
                @updateNode="updateNode"
                @closeDialog="closeEditDialog"
            ></OrganizationEditDialog>
        </v-dialog>
    </div>
</template>

<script>
import ApexTree from 'apextree';
import OrganizationTeamDialog from './OrganizationTeamDialog.vue';
import OrganizationEditDialog from './OrganizationEditDialog.vue';
import AgentBadgesDiagram from './AgentBadgesDiagram.vue';

export default {
    components: {
        OrganizationTeamDialog,
        OrganizationEditDialog,
        AgentBadgesDiagram
    },
    props: {
        node: {
            type: Object,
            default: {},
        },
    },
    data: () => ({
        tree: null,
        userList: [],
        searchQuery: '',
        searchResults: [],
        
        // dialog
        editNode: null,
        teamDialog: false,
        editDialog: false,
        
        // badges diagram
        showBadgesDiagram: false,
        selectedAgent: null,
    }),
    computed: {
        isMobile() {
            return window.innerWidth <= 768;
        },
    },
    watch: {
        async node(newVal) {
            if (newVal && newVal.id && newVal.data) {
                await this.loadUserList();
                this.drawTree()
            }
        },
    },
    async mounted() {
        // 사용자 목록 로드
        await this.loadUserList();
        
        if (this.node && this.node.id && this.node.data) {
            const options = {
                contentKey: 'data',
                nodeWidth: 155,
                nodeHeight: 100,
                childrenSpacing: 50,
                siblingSpacing: 20,
                direction: 'top',
                enableExpandCollapse: false,
                nodeTemplate: (content) => {
                    // 실제 사용자 데이터 가져오기
                    const userData = this.getUserData(content);
                    return `
                    <div class='node-content' id='${content.id}'>
                        <div class="node-content-text-box">
                            <div style="display: flex;">
                                ${content.id == 'root' || content.isTeam ? '' : (userData.profile ? `<img class="node-content-img" src='${userData.profile}' onerror="this.src='/images/defaultUser.png'" />` : `<img class="node-content-img" src='/images/defaultUser.png' />`)}
                                <div style="flex: 1;"></div>
                                
                            </div>
                            <div class="node-content-title-box" data-node-id="${content.id}">
                                <div style="font-weight: bold; font-family: Arial; font-size: 14px;">${userData.username || content.name}</div>
                                ${userData.email ? `<div style="font-family: Arial; font-size: 12px">${userData.email}</div>` : ''}
                                ${userData.role ? `<div style="font-family: Arial; color:gray; font-size: 11px">${userData.role}</div>` : ''}
                            </div>
                        </div>
                    </div>
                    `;
                },
                enableToolbar: true,
            };
            this.tree = new ApexTree(document.getElementById('tree'), options);
            await this.drawTree()

            document.addEventListener('click', (event) => {
                const button = event.target.closest('.node-content-btn');
                if (button) {
                    event.stopPropagation();
                    this.closeBadgesDiagram();
                    
                    // 버튼이 속한 노드 찾기 및 editNode 설정
                    const nodeContent = button.closest('.node-content');
                    if (nodeContent) {
                        this.editNode = this.findOriginalNodeById(this.node, nodeContent.id);
                    }
                    
                    if (button.classList.contains('add-team-btn')) {
                        this.openTeamDialog('add');
                    } else if (button.classList.contains('edit-team-btn')) {
                        this.openTeamDialog('edit');
                    } else if (button.classList.contains('delete-team-btn')) {
                        this.openTeamDialog('delete');
                    } else if (button.classList.contains('add-member-btn')) {
                        this.$emit('addMember', this.editNode);
                    } else if (button.classList.contains('edit-member-btn')) {
                        this.openEditDialog('edit-user');
                    } else if (button.classList.contains('delete-agent-btn')) {
                        this.openEditDialog('delete');
                    }
                }
            });


        }

        this.$refs.tree.addEventListener('click', this.handleNodeClick);
        this.$refs.tree.addEventListener('contextmenu', this.handleNodeClick);
        
        // 터치 이벤트 핸들러 추가
        this.$refs.tree.addEventListener('touchstart', this.handleTouch, { passive: false });
        this.$refs.tree.addEventListener('touchmove', this.handleTouch, { passive: false });
        this.$refs.tree.addEventListener('touchend', this.handleTouch, { passive: false });
    },

    methods: {
        async loadUserList() {
            try {
                // backend 인스턴스가 없으면 생성
                if (!this.backend) {
                    const BackendFactory = (await import('@/components/api/BackendFactory')).default;
                    this.backend = BackendFactory.createBackend();
                }
                this.userList = await this.backend.getUserList({});
            } catch (error) {
                this.userList = [];
            }
        },
        getUserData(content) {
            // root나 팀인 경우 원본 데이터 사용
            if (content.id === 'root' || content.isTeam) {
                return content;
            }
            
            // 사용자 ID로 users 테이블에서 실제 최신 데이터 찾기
            const user = this.userList.find(u => u.id === content.id);
            if (user) {
                return {
                    // users 테이블의 최신 데이터 사용
                    username: user.username,
                    name: user.username || user.name, // AgentBadgesDiagram에서 사용
                    email: user.email,
                    role: user.role,
                    profile: user.profile,
                    // 에이전트 관련 추가 필드들
                    goal: user.goal,
                    persona: user.persona,
                    tools: user.tools,
                    skills: user.skills,
                    agent_type: user.agent_type,
                    isAgent: user.is_agent,
                    alias: user.alias,
                };
            }
            
            // 사용자를 찾지 못한 경우 조직도 데이터 사용 (fallback)
            return {
                username: content.username || content.name,
                name: content.username || content.name,
                email: content.email,
                role: content.role,
                profile: content.profile || content.img,
                goal: content.goal,
                persona: content.persona,
                tools: content.tools,
                skills: content.skills,
                agent_type: content.agent_type,
                isAgent: content.is_agent || content.isAgent,
                alias: content.alias,
            };
        },
        getUserDataById(nodeId) {
            // 조직도 데이터에서 노드 찾기
            const node = this.findNodeInTree(this.node, nodeId);
            if (node) {
                return this.getUserData(node.data || node);
            }
            
            // 노드를 찾지 못한 경우 기본값 반환
            return { name: nodeId };
        },
        findNodeInTree(node, targetId) {
            if (!node) return null;
            
            if (node.id === targetId || node.data?.id === targetId) {
                return node;
            }
            
            if (node.children) {
                for (let child of node.children) {
                    const found = this.findNodeInTree(child, targetId);
                    if (found) return found;
                }
            }
            
            return null;
        },
        drawTree() {
            // 팀원들을 세로 배치하기 위한 데이터 변환
            const transformedNode = this.transformForVerticalLayout(this.node);
            this.tree.render(transformedNode);
            
            // 검색 결과가 있으면 하이라이트 적용
            if (this.searchResults.length > 0) {
                this.applySearchHighlight();
            }
        },
        transformForVerticalLayout(node) {
            if (!node) return node;
            
            
            // 깊은 복사를 통해 원본 데이터 보존
            const clonedNode = JSON.parse(JSON.stringify(node));
            
            // 자식 노드들을 변환
            if (clonedNode.children && clonedNode.children.length > 0) {
                
                clonedNode.children = clonedNode.children.map(child => {
                    const transformedChild = this.transformForVerticalLayout(child);
                    
                    // 팀 노드인 경우 팀원들을 세로로 연결
                    if (transformedChild.data && transformedChild.data.isTeam && 
                        transformedChild.children && transformedChild.children.length > 0) {
                        
                        
                        // 팀원들을 체인 형태로 연결
                        const members = transformedChild.children;
                        if (members.length > 1) {
                            
                            // 첫 번째 팀원부터 시작하여 체인 연결
                            for (let i = 0; i < members.length - 1; i++) {
                                members[i].children = [members[i + 1]];
                            }
                            // 마지막 팀원은 자식이 없음
                            members[members.length - 1].children = [];
                            
                            // 팀의 자식은 첫 번째 팀원만
                            transformedChild.children = [members[0]];
                            
                        }
                    }
                    
                    return transformedChild;
                });
            }
            
            return clonedNode;
        },
        onSearchInput() {
            if (this.searchQuery.trim()) {
                this.performSearch();
            } else {
                this.clearSearch();
            }
        },
        performSearch() {
            this.searchResults = [];
            this.applySearchHighlight();
        },
        applySearchHighlight() {
            // 검색어가 없으면 모든 하이라이트 제거
            if (!this.searchQuery.trim()) {
                this.clearSearch();
                return;
            }
            
            // 모든 노드 검사하여 이름 기반으로 하이라이팅
            const allNodes = document.querySelectorAll('.node-content');
            allNodes.forEach(nodeEl => {
                const textBox = nodeEl.querySelector('.node-content-text-box');
                if (textBox) {
                    // 노드 ID로 사용자 데이터 찾기
                    const nodeId = nodeEl.id;
                    const userData = this.getUserDataById(nodeId);
                    const name = userData.username || userData.name || nodeId;
                    
                    // 이름이 검색어를 포함하는지 확인
                    if (name && name.toLowerCase().includes(this.searchQuery.toLowerCase())) {
                        // 하이라이트 적용
                        textBox.style.backgroundColor = 'rgb(var(--v-theme-primary))';
                        textBox.style.color = 'white';
                        // 모든 텍스트 요소를 흰색으로 변경
                        const textElements = textBox.querySelectorAll('div');
                        textElements.forEach(textEl => {
                            textEl.style.color = 'white !important';
                        });
                        // 버튼들에 흰색 배경 적용
                        const buttonElements = textBox.querySelectorAll('.node-content-btn');
                        buttonElements.forEach(btnEl => {
                            btnEl.style.backgroundColor = 'white';
                        });
                    } else {
                        // 하이라이트 제거
                        textBox.style.backgroundColor = '';
                        textBox.style.color = '';
                        // 텍스트 요소들도 색상 초기화
                        const textElements = textBox.querySelectorAll('div');
                        textElements.forEach(textEl => {
                            textEl.style.color = '';
                        });
                        // 버튼 배경색 제거
                        const buttonElements = textBox.querySelectorAll('.node-content-btn');
                        buttonElements.forEach(btnEl => {
                            btnEl.style.backgroundColor = '';
                        });
                    }
                }
            });
        },
        clearSearch() {
            this.searchQuery = '';
            this.searchResults = [];
            
            // 모든 하이라이트 제거
            const allNodes = document.querySelectorAll('.node-content');
            allNodes.forEach(nodeEl => {
                const textBox = nodeEl.querySelector('.node-content-text-box');
                if (textBox) {
                    textBox.style.backgroundColor = '';
                    textBox.style.color = '';
                    // 텍스트 요소들도 색상 초기화
                    const textElements = textBox.querySelectorAll('div');
                    textElements.forEach(textEl => {
                        textEl.style.color = '';
                    });
                    // 아이콘들도 원래 색상으로 복원
                    const iconElements = textBox.querySelectorAll('.node-content-icon');
                    iconElements.forEach(iconEl => {
                        iconEl.style.filter = '';
                    });
                }
            });
        },
        findNodeById(node, id) {
            if (node.id === id) {
                return node;
            }
            if (node.children) {
                for (let child of node.children) {
                    let found = this.findNodeById(child, id);
                    if (found) {
                        return found;
                    }
                }
            }
            return null;
        },
        // 원본 데이터에서 노드를 찾는 메서드 (변환 전 데이터 사용)
        findOriginalNodeById(node, id) {
            if (node.id === id) {
                return node;
            }
            if (node.children) {
                for (let child of node.children) {
                    let found = this.findOriginalNodeById(child, id);
                    if (found) {
                        return found;
                    }
                }
            }
            return null;
        },
        handleNodeClick(event) {
            event.preventDefault();
            const target = event.target.closest('.node-content');
            if (target) {
                if (this.previousTarget && this.previousTarget !== target) {
                    const previousTextBox = this.previousTarget.querySelector('.node-content-text-box');
                    if (previousTextBox) {
                        previousTextBox.style.backgroundColor = '';
                    }
                }
                // 원본 데이터에서 노드를 찾아서 사용
                const foundNode = this.findOriginalNodeById(this.node, target.id);
                if (foundNode && foundNode.data) {
                    this.editNode = foundNode;
                    
                    // Agent 클릭 시 뱃지 다이어그램 토글, 아닌 경우 닫기
                    if (foundNode.data.isAgent) {
                        // 이미 같은 Agent가 선택되어 있고 다이어그램이 열려있으면 닫기
                        if (this.showBadgesDiagram && this.selectedAgent && this.selectedAgent.id === foundNode.data.id) {
                            this.closeBadgesDiagram();
                        } else {
                            // users 테이블에서 최신 데이터 가져와서 AgentBadgesDiagram에 전달
                            const latestAgentData = this.getUserData(foundNode.data);
                            this.selectedAgent = {
                                ...foundNode.data,
                                ...latestAgentData,
                                id: foundNode.data.id // ID는 유지
                            };
                            this.showBadgesDiagram = true;
                        }
                    } else {
                        this.closeBadgesDiagram();
                    }
                }
                const textBox = target.querySelector('.node-content-text-box');
                if (textBox) {
                    textBox.style.backgroundColor = `rgba(var(--v-theme-primary), 0.20)`;
                }
                this.previousTarget = target;
            } else {
                if (this.previousTarget) {
                    this.previousTarget.style.backgroundColor = '';
                }
                // 빈 공간 클릭 시에도 뱃지 다이어그램 닫기
                this.closeBadgesDiagram();
            }
        },
        closeBadgesDiagram() {
            this.showBadgesDiagram = false;
            this.selectedAgent = null;
        },
        handleAgentEditFromBadges(agentData) {
            // AgentBadgesDiagram에서 수정 버튼 클릭 시 호출
            // selectedAgent를 editNode로 설정하고 수정 다이얼로그 열기
            if (agentData) {
                // 조직도에서 해당 에이전트 노드 찾기
                const foundNode = this.findOriginalNodeById(this.node, agentData.id);
                if (foundNode) {
                    this.editNode = foundNode;
                    this.openEditDialog('edit-agent');
                }
            }
        },
        openTeamDialog(type) {
            this.teamDialog = true;
            this.teamDialogType = type;
        },
        closeTeamDialog() {
            this.teamDialog = false;
            this.teamDialogType = '';
        },
        async updateTeam(type, editNode, newTeam) {
            if (type == 'add') {
                this.node.children.push({
                    id: newTeam.id,
                    data: newTeam,
                    children: []
                })
            } else if (type == 'delete') {
                this.node.children = await this.deleteNode(editNode, this.node.children);
            } else if (type == 'edit') {
                if (editNode.data.isTeam) {
                    this.node.children.forEach(team => {
                        if (team.id == editNode.id) {
                            team = editNode
                        }
                    })
                }
            }
            await this.drawTree();
            this.$emit('updateNode');
            this.closeTeamDialog();
        },
        deleteNode(obj, children) {
            if (children && children.some(item => item.id == obj.id)) {
                children = children.filter(item => item.id != obj.id);
            } else {
                children.forEach(async (item) => {
                    item.children = await this.deleteNode(obj, item.children);
                })
            }
            return children;
        },
        openEditDialog(type) {
            this.editDialog = true;
            this.editDialogType = type;
        },
        closeEditDialog() {
            this.editDialog = false;
            this.editDialogType = '';
        },
        
        async updateNode(type, editNode) {
            if (type == 'edit' || type == 'edit-agent') {
                this.node.children.forEach(team => {
                    if (team.id == editNode.id) {
                        team = editNode
                    }
                })
                // 에이전트 수정인 경우 정확한 타입으로 emit
                const emitType = type === 'edit-agent' ? 'edit-agent' : 'edit';
                this.$emit('updateAgent', emitType, editNode);
            } else if (type == 'delete') {
                this.node.children = await this.deleteNode(editNode, this.node.children);
                this.$emit('updateAgent', type, editNode);
            }
            await this.drawTree();
            this.$emit('updateNode');
            this.closeEditDialog();
        },
        handleTouch(e) {
            
            // 버튼 영역이면 터치 이벤트 처리하지 않음
            if (e.target.closest('.node-content-btn')) {
                return;
            }
            
            // 터치 끝날 때 클릭으로 처리 (모바일에서 더 안정적)
            if (e.type === 'touchend' && e.changedTouches && e.changedTouches.length === 1) {
                const touch = e.changedTouches[0];
                const target = document.elementFromPoint(touch.clientX, touch.clientY);
                const nodeContent = target?.closest('.node-content');
                
                if (nodeContent) {
                    // 직접 handleNodeClick 호출
                    const syntheticEvent = {
                        type: 'click',
                        target: nodeContent,
                        preventDefault: () => {},
                        stopPropagation: () => {}
                    };
                    this.handleNodeClick(syntheticEvent);
                }
                e.preventDefault();
                return;
            }
            
            // 기존 터치-마우스 변환 로직 (스크롤/줌을 위해 유지)
            if (e.touches && e.touches.length === 1) {
                const touch = e.touches[0];
                const mouseEvent = new MouseEvent(
                    e.type === 'touchstart' ? 'mousedown' :
                    e.type === 'touchmove' ? 'mousemove' :
                    e.type === 'touchend' ? 'mouseup' : '',
                    {
                        bubbles: true,
                        cancelable: true,
                        clientX: touch.clientX,
                        clientY: touch.clientY,
                    }
                );
                e.target.dispatchEvent(mouseEvent);
                e.preventDefault();
            }
        },

    },
}
</script>

<style scoped>
.organization-chart-search-container {
    position: absolute;
    top: 20px;
    left: 20px;
    z-index: 100;
    width: 300px;
}

.header-search {
    background-color: white !important;
    min-height: 36px !important;
    height: 36px !important;
}

#tree {
    width: 98% !important;
    height: 99% !important;
}

@media screen and (max-width: 768px) {
    #tree {
        height: calc(100vh - 40px) !important;
    }
}
</style>

