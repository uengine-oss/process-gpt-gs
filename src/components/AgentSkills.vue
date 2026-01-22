<template>
    <div>
        <!-- skills tools -->
        <div class="d-flex mt-1">
            <div class="ml-2">
                <v-btn variant="text" icon size="small" @click="toggleRepositoryUpload">
                    <v-icon>mdi-github</v-icon>
                </v-btn>
                <v-tooltip activator="parent" location="right">
                    <span>Repository로 스킬 추가</span>
                </v-tooltip>
            </div>
            
            <div class="ml-2">
                <v-btn variant="text" icon size="small" @click="openSkillUpload">
                    <v-icon>mdi-folder-zip-outline</v-icon>
                </v-btn>
                <v-tooltip activator="parent" location="right">
                    <span>파일로 스킬 추가</span>
                </v-tooltip>
                <input type="file" ref="skillUploadInput" accept=".zip" style="display: none;" @change="handleSkillUpload">
            </div>

            <div class="ml-2">
                <v-btn 
                    variant="text" 
                    icon size="small" 
                    :disabled="selectedNodeId === null"
                    @click="addNode('folder')"
                >
                    <v-icon>mdi-folder-plus-outline</v-icon>
                </v-btn>
                <v-tooltip activator="parent" location="right">
                    <span>폴더 추가</span>
                </v-tooltip>
            </div>

            <div>
                <v-btn 
                    variant="text" 
                    icon size="small" 
                    :disabled="selectedNodeId === null || isFileNode"
                    @click="addNode('file')"
                >
                    <v-icon>mdi-file-document-plus-outline</v-icon>
                </v-btn>
                <v-tooltip activator="parent" location="right">
                    <span>문서 추가</span>
                </v-tooltip>
            </div>
        </div>

        <div v-if="showRepositoryUpload" class="d-flex align-center mt-3 px-2">
            <v-text-field
                v-model="repositoryUrl"
                label="Repository URL"
                placeholder="https://github.com/username/repository.git"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="isLoading"
            ></v-text-field>
            <v-btn @click="uploadSkills({ type: 'url', url: repositoryUrl })" 
                :loading="isLoading && repositoryUrl !== ''"
                variant="text" 
                size="small" 
                color="primary"
            >
                {{ $t('Common.add') }}
            </v-btn>
        </div>
        

        <!-- skills tree -->
        <v-card flat class="px-3 py-2">
            <v-treeview
                :config="config"
                :nodes="nodes"
                style="user-select: none; width: 100%;"
            >
                <template #before-input="{ node }">
                    <div @click="handleNodeClick(node)" class="d-inline-flex align-center justify-space-between cursor-pointer w-100"
                        :class="{
                            'text-primary': selectedNodeId === node.id,
                            'selected-node-background': selectedNodeId === node.id,
                        }"
                    >
                        <span v-if="editingNodeId !== node.id || node.data.type !== 'folder'" class="text-subtitle-1 font-weight-medium text-truncate ml-1">
                            {{ node.text }}
                            <v-tooltip activator="parent" location="bottom">
                                {{ node.text }}
                            </v-tooltip>
                        </span>
                        <v-text-field
                            v-else
                            v-model="editingFolderName"
                            variant="plain"
                            density="compact"
                            hide-details
                            class="ml-1"
                            style="min-width: 100px; max-width: 200px;"
                            @keyup.enter="finishEditFolder(node)"
                            @keyup.esc="cancelEditFolder"
                            ref="folderNameInput"
                            autofocus
                        ></v-text-field>
                        <div v-if="node.data.type === 'skill'">
                            <v-btn 
                                v-if="node.exists"
                                variant="text" 
                                icon 
                                size="x-small" color="error" 
                                @click="showDeleteDialog = true; selectedNodeId = node.id;">
                                <v-icon>mdi-delete</v-icon>
                            </v-btn>
                            <v-progress-circular
                                v-else
                                size="12"
                                width="2"
                                color="primary"
                                indeterminate
                            ></v-progress-circular>
                        </div>
                        <div v-else-if="node.data.type === 'folder'">
                            <v-btn
                                v-if="editingNodeId !== node.id"
                                variant="text"
                                icon size="x-small"
                                @click.stop="startEditFolder(node)"
                            >
                                <v-icon>mdi-pencil-outline</v-icon>
                            </v-btn>
                            <v-btn
                                v-else
                                variant="text"
                                icon size="x-small"
                                color="primary"
                                @click.stop="finishEditFolder(node)"
                            >
                                <v-icon>mdi-check</v-icon>
                            </v-btn>
                        </div>
                    </div>
                </template>
            </v-treeview>
        </v-card>

        <v-dialog v-model="showDeleteDialog" max-width="400">
            <v-card>
                <v-card-title>
                    스킬 삭제
                </v-card-title>
                <v-card-text>
                    삭제된 스킬은 복구할 수 없습니다. 정말 삭제하시겠습니까?
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="showDeleteDialog = false" variant="flat" color="error" rounded>
                        {{ $t('Common.cancel') }}
                    </v-btn>
                    <v-btn @click="deleteSkills" variant="flat" color="primary" rounded>
                        {{ $t('Common.delete') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import VTreeview from 'vue3-treeview';

import BackendFactory from '@/components/api/BackendFactory';

export default {
    components: {
        VTreeview,
    },
    data: () => ({
        backend: null,
        skills: [],
        
        // uploaded repository url
        showRepositoryUpload: false,
        repositoryUrl: '',

        // skills tree
        nodes: {},
        config: {
            roots: []
        },
        selectedNodeId: null,

        // delete dialog
        showDeleteDialog: false,

        // folder editing
        editingNodeId: null,
        editingFolderName: '',
        originalFolderName: '',

        isLoading: false,
    }),
    computed: {
        isFileNode() {
            return this.selectedNodeId && this.nodes[this.selectedNodeId] && this.nodes[this.selectedNodeId].data?.type === 'file';
        },
    },
    watch: {
        selectedNodeId: {
            async handler(newVal) {
                const selectedNode = this.nodes[newVal];
                if (!selectedNode || (selectedNode.data && selectedNode.data.type !== 'file')) {
                    return;
                }
                console.log(selectedNode);
                const skillName = selectedNode.id.split('::')[0];
                const filePath = selectedNode.data.path;
                const skillFile = await this.backend.getSkillFile(skillName, filePath);
                this.$emit('update:skillFile', skillFile);
            },
            deep: true
        }
    },
    created() {
        this.backend = BackendFactory.createBackend();
    },
    async mounted() {
        await this.loadSkillFiles();

        this.EventBus.on('skills-updated', async () => {
            await this.loadSkillFiles();
        });
    },
    methods: {
        openSkillUpload() {
            this.$refs.skillUploadInput.click();
        },
        handleSkillUpload(event) {
            const files = event.target.files;
            if (files && files.length > 0) {
                const skillName = files[0].name;
                if (!this.config.roots.includes(skillName)) {
                    this.config.roots.push(skillName);
                }
                this.nodes[skillName] = {
                    id: skillName,
                    text: skillName,
                    children: [],
                    state: {
                        opened: false
                    },
                    data: {
                        type: 'skill',
                        originalId: skillName,
                        fileCount: 1,
                        description: '',
                        source: null,
                        documentCount: null
                    },
                    exists: false
                }
                const options = {
                    type: 'file',
                    file: files[0]
                };
                this.uploadSkills(options);
            }
        },
        toggleRepositoryUpload() {
            this.showRepositoryUpload = !this.showRepositoryUpload;
            this.repositoryUrl = '';
        },
        async uploadSkills(options) {
            this.isLoading = true;
            try {
                const data = await this.backend.uploadSkills(options);
                this.isLoading = false;
                if (data && data.skills_added && data.skills_added.length > 0) {
                    await this.loadSkillFiles();
                }
            } catch (error) {
                console.error('스킬 업로드 실패:', error);
                this.isLoading = false;
            }
        },
        async loadSkillFiles() {
            const tenantInfo = await this.backend.getTenantInfo(window.$tenantName);
            this.skills = tenantInfo.skills || [];

            this.nodes = {};
            this.config.roots = [];
            const validSkills = [];

            for (const skillName of this.skills) {
                let skillId = skillName;
                try {
                    const skillCheck = await this.backend.checkSkills({
                        skillName: skillName
                    });

                    if (!skillCheck || skillCheck.exists === false) {
                        console.warn(`서버에 스킬이 존재하지 않습니다: ${skillName}`);
                        continue;
                    }

                    const skill = await this.backend.getSkillFile(skillName);
                    if (!skill || !skill.skill_name) {
                        console.warn(`스킬 파일 정보를 가져올 수 없습니다: ${skillName}`);
                        continue;
                    }

                    skillId = skill.skill_name;
                    const skillText = skillCheck.name || skillId;
                    const files = Array.isArray(skill.files) ? skill.files : [];

                    // 스킬 파일이 없는 경우 해당 스킬은 제외
                    if (files.length === 0) {
                        console.warn(`스킬 파일이 없습니다: ${skillName}`);
                        continue;
                    }

                    // 유효한 스킬로 추가
                    validSkills.push(skillId);

                    if (!this.config.roots.includes(skillId)) {
                        this.config.roots.push(skillId);
                    }

                    this.nodes[skillId] = {
                        id: skillId,
                        text: skillText,
                        children: [],
                        state: {
                            opened: false
                        },
                        data: {
                            type: 'skill',
                            originalId: skillId,
                            fileCount: files.length,
                            description: skillCheck.description || '',
                            source: skillCheck.source || null,
                            documentCount: skillCheck.document_count ?? null
                        },
                        exists: true
                    };

                    files.forEach((file, index) => {
                        const rawPath = (file.path || file.file_name || file.name || '').replace(/\\/g, '/');
                        const fallbackName = file.file_name || file.name || `file_${index + 1}`;
                        const segments = (rawPath ? rawPath.split('/') : [fallbackName]).filter(segment => segment && segment.trim().length > 0);

                        if (segments.length === 0) {
                            segments.push(fallbackName);
                        }

                        let parentId = skillId;
                        let accumulatedPath = '';

                        segments.forEach((segment, segmentIndex) => {
                            accumulatedPath = accumulatedPath ? `${accumulatedPath}/${segment}` : segment;
                            const nodeId = `${skillId}::${accumulatedPath}`;
                            const isFile = segmentIndex === segments.length - 1;

                            if (!this.nodes[nodeId]) {
                                this.nodes[nodeId] = {
                                    id: nodeId,
                                    text: segment,
                                    children: [],
                                    ...(isFile ? {} : {
                                        state: {
                                            opened: false
                                        }
                                    }),
                                    data: {
                                        type: isFile ? 'file' : 'folder',
                                        originalId: segment,
                                        path: accumulatedPath,
                                        size: isFile ? (file.size ?? null) : null,
                                        modified: isFile ? (file.modified ?? null) : null
                                    },
                                    exists: true
                                };
                            } else if (isFile) {
                                this.nodes[nodeId].data.size = file.size ?? null;
                                this.nodes[nodeId].data.modified = file.modified ?? null;
                                this.nodes[nodeId].text = segment;
                            }

                            const parentChildren = this.nodes[parentId].children;
                            if (!parentChildren.includes(nodeId)) {
                                parentChildren.push(nodeId);
                            }

                            parentId = nodeId;
                        });
                    });

                    this.nodes[skillId].data = {
                        type: 'skill',
                        originalId: skillId,
                        fileCount: files.length,
                        description: skillCheck.description || '',
                        source: skillCheck.source || null,
                        documentCount: skillCheck.document_count ?? null
                    };

                } catch (error) {
                    delete this.nodes[skillId];
                    const rootIndex = this.config.roots.indexOf(skillId);
                    if (rootIndex > -1) {
                        this.config.roots.splice(rootIndex, 1);
                    }
                    console.error(`스킬 파일 정보를 불러오는데 실패했습니다: ${skillName}`, error);
                }
            }

            // 유효한 스킬만 테넌트 정보에 저장
            if (validSkills.length !== this.skills.length) {
                try {
                    await this.backend.saveSkills(validSkills, true);
                } catch (saveError) {
                    console.error('유효한 스킬 저장 실패:', saveError);
                }
            }
        },

        /**
         * 트리 노드 클릭 핸들러
         * @param {Object} node - 클릭된 노드 객체
         */
        handleNodeClick(node) {
            // 편집 중일 때는 클릭 처리하지 않음
            if (this.editingNodeId) {
                return;
            }
            this.selectedNodeId = null;
            if (!node || !node.id) {
                return;
            }
            const nodeId = node.id;
            const nodeType = node?.data?.type;

            if (nodeType === 'skill' || nodeType === 'folder') {
                if (!node.state) {
                    const initialState = {
                        opened: false
                    };
                    node.state = initialState;
                    if (this.nodes[nodeId]) {
                        this.nodes[nodeId].state = initialState;
                    }
                } else if (this.nodes[nodeId] && this.nodes[nodeId].state !== node.state) {
                    this.nodes[nodeId].state = node.state;
                }
                node.state.opened = !node.state.opened;
            }

            this.selectedNodeId = nodeId;
        },
        async deleteSkills() {
            this.showDeleteDialog = false;
            if (!this.selectedNodeId) {
                return;
            }
            this.nodes[this.selectedNodeId].exists = false;
            const options = {
                skillName: this.selectedNodeId,
            }
            await this.backend.deleteSkills(options);
            await this.loadSkillFiles();
        },
        addNode(type) {
            let newNode = null;
            let parentNode = null;
            if (type === 'file') {
                const result = this.addFile();
                newNode = result.fileNode;
                parentNode = result.parentNode;
            } else if (type === 'folder') {
                const result = this.addFolder();
                newNode = result.folderNode;
                parentNode = result.parentNode;
            }
            if (!newNode || !parentNode) {
                return;
            }

            this.nodes[newNode.id] = newNode;
            this.selectedNodeId = newNode.id;
            parentNode.children.push(newNode.id);
        },
        addFile() {
            const parentNode = this.nodes[this.selectedNodeId];
            if (!parentNode) {
                return;
            }

            let newNodeId = parentNode.id;
            let newNodePath = '';
            
            if (parentNode.data.type === 'skill') {
                newNodeId += '::new_file.md'
                newNodePath = 'new_file.md';
            } else if (parentNode.data.type === 'folder') {
                newNodeId += '/new_file.md'
                newNodePath = parentNode.data.path + '/new_file.md';
            }
            
            const fileNode = {
                id: newNodeId,
                text: 'new_file.md',
                children: [],
                data: {
                    type: 'file',
                    path: newNodePath
                },
                parent: parentNode.data.parent,
                exists: false
            }
            return { fileNode, parentNode };
        },
        addFolder() {
            let parentNode = this.nodes[this.selectedNodeId];
            if (!parentNode) {
                return;
            }
            let newNodeId = parentNode.id;
            let newNodePath = '';
            
            if (parentNode.data.type === 'skill') {
                newNodeId += '::new_folder'
                newNodePath = 'new_folder';
            } else if (parentNode.data.type === 'folder') {
                newNodeId += '/new_folder'
                newNodePath = parentNode.data.path + '/new_folder';
            } else if (parentNode.data.type === 'file') {
                const parentId = newNodeId.split('/').slice(0, -1).join('/')
                parentNode = this.nodes[parentId];
                newNodeId = newNodeId.split('/').slice(0, -1).join('/') + '/new_folder';
                newNodePath = parentNode.data.path + '/new_folder';
            }
            
            const folderNode = {
                id: newNodeId,
                text: 'new_folder',
                children: [],
                data: {
                    originalId: newNodeId,
                    type: 'folder',
                    path: newNodePath
                },
                state: {
                    opened: false
                },
                parent: parentNode.data.parent,
                exists: false
            }
            return { folderNode, parentNode };
        },
        startEditFolder(node) {
            this.editingNodeId = node.id;
            this.editingFolderName = node.text;
            this.originalFolderName = node.text;
            this.$nextTick(() => {
                const input = this.$refs.folderNameInput;
                if (input && input.length > 0) {
                    input[0].$el.querySelector('input')?.focus();
                    input[0].$el.querySelector('input')?.select();
                } else if (input && input.$el) {
                    input.$el.querySelector('input')?.focus();
                    input.$el.querySelector('input')?.select();
                }
            });
        },
        finishEditFolder(node) {
            if (this.editingNodeId !== node.id) {
                return;
            }

            const newName = this.editingFolderName.trim();
            if (!newName || newName === this.originalFolderName) {
                this.cancelEditFolder();
                return;
            }

            // 폴더명 업데이트
            if (this.nodes[node.id]) {
                this.nodes[node.id].text = newName;
                // 경로도 업데이트해야 할 수 있음
                if (this.nodes[node.id].data && this.nodes[node.id].data.path) {
                    const pathParts = this.nodes[node.id].data.path.split('/');
                    pathParts[pathParts.length - 1] = newName;
                    this.nodes[node.id].data.path = pathParts.join('/');
                }
            }

            this.editingNodeId = null;
            this.editingFolderName = '';
            this.originalFolderName = '';
        },
        cancelEditFolder() {
            this.editingNodeId = null;
            this.editingFolderName = '';
            this.originalFolderName = '';
        },
    }
}
</script>

<style scoped>
::v-deep(.tree .node-text) {
    display: none;
}

.selected-node-background {
    background-color: rgba(var(--v-theme-primary), 0.1);
}
</style>
