<template>
    <div>
        <div>
            <InfoAlert :howToUseInfo="howToUseInfo"/>
            <div v-if="timeline.length > 0" class="timeline-list">
                <div v-for="(item, index) in timeline" :key="getTimelineKey(item, index)" class="timeline-item">
                    <!-- 작업 카드 -->
                    <div v-if="item.type === 'task'" class="task-card">
                        <!-- 작업 헤더 -->
                        <div class="task-header">
                            <div class="task-left">
                                <div class="task-avatar">
                                    <img v-if="item.payload.agentProfile" :src="item.payload.agentProfile" alt="Agent" class="avatar-image"/>
                                    <span v-else>{{ index + 1 }}</span>
                                </div>
                                <div class="task-info">
                                    <h3 class="task-title">{{ getDisplayName(item.payload) }}</h3>
                                    <p class="task-description">{{ getTaskDescription(item.payload) }}</p>
                                </div>
                            </div>
                            <div class="task-header-right">
                                <div :class="getTaskStatusClass(item.payload)">
                                    <div class="status-dot"></div>
                                    <span>{{ getStatusText(item.payload) }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- 작업 메타데이터 -->
                        <div class="task-meta">
                            <div v-for="meta in getTaskMeta(item.payload)" :key="meta.label" class="meta-item">
                                <span class="meta-label">{{ meta.label }}</span>
                                <span class="meta-value">{{ meta.value }}</span>
                            </div>
                        </div>

                        <div v-if="item.payload.crewType === 'browser-use' && !item.payload.isCompleted" class="browser-container">
                            <div class="browser-preview" @click="openBrowserDialog(item.id)">
                                <iframe 
                                    :src="browserIframeUrl" 
                                    class="browser-iframe" 
                                    frameborder="0" 
                                    allowfullscreen>
                                </iframe>
                                <div class="expand-overlay">
                                    <v-btn icon class="expand-btn">
                                        <v-icon size="large">mdi-fullscreen</v-icon>
                                    </v-btn>
                                </div>
                            </div>
                        </div>

                        <!-- Human Asked 응답 영역 -->
                        <div v-if="item.payload.isHumanAsked" class="human-query-input">
                            <div class="query-header">
                                <h4 class="query-title">{{ $t('agentMonitor.request') }}</h4>
                                <div class="role-pill">{{ item.payload.role }}</div>
                            </div>
                            <div class="query-content">
                                <p class="query-question">{{ item.payload.humanQueryData.text || $t('agentMonitor.requestContent') }}</p>
                                <div v-if="!item.payload.isCompleted && item.payload.humanQueryData.type === 'text'" class="input-field">
                                    <input 
                                        v-model.trim="humanQueryAnswers[item.payload.id]" 
                                        class="query-input" 
                                        type="text" 
                                        :placeholder="$t('agentMonitor.inputAnswer')" 
                                    />
                                </div>
                                <div v-else-if="!item.payload.isCompleted && item.payload.humanQueryData.type === 'select'" class="input-field">
                                    <select v-model="humanQueryAnswers[item.payload.id]" class="query-select">
                                        <option disabled value="">{{ $t('agentMonitor.selectAnswer') }}</option>
                                        <option v-for="opt in item.payload.humanQueryData.options" :key="opt" :value="opt">{{ opt }}</option>
                                    </select>
                                </div>
                                <div v-else-if="!item.payload.isCompleted && item.payload.humanQueryData.type === 'confirm'" class="confirm-hint">
                                    {{ $t('agentMonitor.continue') }}
                                </div>
                            </div>
                            <v-row v-if="!item.payload.isCompleted" class="query-actions ma-0 pa-0">
                                <v-spacer></v-spacer>
                                <v-btn @click="onCancelHumanQuery(item.payload)"
                                    class="query-cancel rounded-pill mr-2" 
                                    variant="elevated" 
                                    color="grey"
                                    density="compact"
                                >
                                    {{ $t('agentMonitor.cancel') }}
                                </v-btn>
                                <v-btn @click="onConfirmHumanQuery(item.payload)"
                                    class="query-confirm rounded-pill" 
                                    color="primary"
                                    variant="elevated" 
                                    density="compact"
                                    :disabled="item.payload.humanQueryData.type !== 'confirm' && !humanQueryAnswers[item.payload.id]" 
                                >
                                    {{ $t('agentMonitor.confirm') }}
                                </v-btn>
                            </v-row>
                            <div v-else class="query-completed">
                                <span class="completed-pill" :class="getHumanResultClass(item.payload)">{{ getHumanResultText(item.payload) }}</span>
                                <span v-if="getHumanResultDetail(item.payload)" class="completed-detail">{{ getHumanResultDetail(item.payload) }}</span>
                            </div>
                        </div>

                        <!-- 작업 결과 -->
                        <div v-else-if="item.payload.isCompleted && item.payload.content" class="task-result">
                            <div class="result-header">
                                <v-row class="ma-0 pa-0 align-center">
                                    <h4 class="result-title">{{ $t('agentMonitor.result') }}</h4>
                                    <v-spacer></v-spacer>
                                    <v-btn v-if="shouldShowSubmitButton(item.payload)"
                                            @click="submitTask(item.payload)"
                                            color="primary"
                                            variant="elevated" 
                                            class="rounded-pill"
                                            density="compact"
                                    >
                                    {{ $t('agentMonitor.accept') }}
                                </v-btn>
                                </v-row>
                            </div>
                            <div class="result-content">
                                <!-- 슬라이드 결과 -->
                                <div v-if="item.payload.crewType === 'slide'" class="slides-container">
                                    <div class="slides-header">
                                        <div class="header-info">
                                            <h5>{{ $t('agentMonitor.presentationMode') }}</h5>
                                            <span class="slide-hint">{{ $t('agentMonitor.slideHint') }}</span>
                                        </div>
                                        <div class="slide-navigation">
                                            <button @click="previousSlide(item.payload.id)" :disabled="getSlideIndex(item.payload.id) === 0" class="nav-btn">←</button>
                                            <span class="slide-counter">{{ getSlideIndex(item.payload.id) + 1 }} / {{ getSlides(item.payload.content).length }}</span>
                                            <button @click="nextSlide(item.payload.id)" :disabled="getSlideIndex(item.payload.id) === getSlides(item.payload.content).length - 1" class="nav-btn">→</button>
                                        </div>
                                    </div>
                                    <div class="slide-content">
                                            <div v-html="getCurrentSlide(item.payload)" class="slide-inner"></div>
                                    </div>
                                    <div class="slide-indicators">
                                            <span v-for="(slide, index) in getSlides(item.payload.content)" :key="index"
                                                    :class="['indicator', { active: index === getSlideIndex(item.payload.id) }]"
                                                    @click="goToSlide(item.payload.id, index)"></span>
                                    </div>
                                </div>
                                
                                <!-- Browser-use 결과 -->
                                <div v-else-if="item.payload.crewType === 'browser-use'" class="pa-4 browser-result">
                                    <div class="browser-result-header">
                                        <h5>{{ $t('EventTimeline.browserAutomationResult') }}</h5>
                                        <div class="browser-status" :class="{ 'success': item.payload.outputRaw?.success }">
                                        {{ item.payload.outputRaw?.success ? `✅ ${$t('EventTimeline.completed')}` : `❌ ${$t('EventTimeline.failed')}` }}
                                        </div>
                                    </div>
                                    
                                    <div v-if="item.payload.outputRaw?.result_summary" class="browser-summary">
                                        <h6>{{ $t('EventTimeline.taskSummary') }}</h6>
                                        <div class="summary-text">{{ item.payload.outputRaw.result_summary }}</div>
                                    </div>
                                    
                                    <div v-if="item.payload.outputRaw?.completed_at" class="browser-time">
                                        <h6>{{ $t('EventTimeline.completedTime') }}</h6>
                                        <div class="time-text">{{ formatDateTime(item.payload.outputRaw.completed_at) }}</div>
                                    </div>

                                    <!-- 생성된 파일들 -->
                                    <div v-if="item.payload.outputRaw?.generated_files" class="browser-files">
                                        <h6>{{ $t('EventTimeline.generatedFiles') }}</h6>
                                        
                                        <!-- 일반 파일들 -->
                                        <div class="files-list">
                                            <div v-for="[fileName, file] in filteredFiles(item.payload.outputRaw.generated_files)" :key="fileName" class="file-item">
                                                <div class="file-header">
                                                    <span class="file-name">{{ fileName }}</span>
                                                    <div class="file-actions">
                                                        <span class="file-size">{{ formatFileSize(file.size) }}</span>
                                                        <v-btn v-if="file.url" 
                                                            @click="downloadFile(fileName, file)" 
                                                            size="small" 
                                                            variant="elevated" 
                                                            color="primary" 
                                                            class="ml-2"
                                                            density="compact">
                                                            <v-icon size="small" class="mr-1">mdi-download</v-icon>
                                                            {{ '다운로드' }}
                                                        </v-btn>
                                                    </div>
                                                </div>
                                                
                                                <!-- 파싱 중 로딩 표시 -->
                                                <div v-if="file.parsing" class="file-parsing">
                                                    <v-progress-circular indeterminate color="primary" size="20" width="2" class="mr-2"></v-progress-circular>
                                                    <span class="parsing-text">{{ $t('EventTimeline.parsingDocument') }}</span>
                                                </div>
                                                
                                                <!-- 파싱 오류 표시 -->
                                                <div v-else-if="file.parsed_error" class="file-error">
                                                    <v-icon size="small" color="error" class="mr-1">mdi-alert-circle</v-icon>
                                                    <span class="error-text">{{ $t('EventTimeline.parsingFailed') }}: {{ file.parsed_error }}</span>
                                                </div>
                                                
                                                <!-- 파싱된 내용 표시 -->
                                                <div v-else-if="file.content || file.parsed_content" class="file-content">
                                                    <div class="markdown-container" v-html="formatMarkdownContent(file.content || file.parsed_content)"></div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- 이미지 슬라이드 -->
                                        <div v-if="getImageSlides(item.payload.outputRaw.generated_files).length > 0" class="image-slides-container">
                                            <div class="image-slides-header">
                                                <div class="header-info">
                                                    <h5>{{ $t('EventTimeline.imageGallery') }}</h5>
                                                    <span class="slide-hint">{{ getImageSlides(item.payload.outputRaw.generated_files).length }}{{ $t('EventTimeline.images') }}</span>
                                                </div>
                                                <div class="slide-navigation">
                                                    <button @click="previousImageSlide()" :disabled="imageIndex === 0" class="nav-btn">←</button>
                                                    <span class="slide-counter">{{ imageIndex + 1 }} / {{ images.length }}</span>
                                                    <button @click="nextImageSlide()" :disabled="imageIndex === images.length - 1" class="nav-btn">→</button>
                                                </div>
                                            </div>
                                            <div class="image-slide-content">
                                                <div class="image-wrapper">
                                                    <img v-if="images[imageIndex]" 
                                                        :src="images[imageIndex].src" 
                                                        :alt="images[imageIndex].alt" 
                                                        class="image-slide-image" />
                                                    <button @click="openImageDialog(item.payload.outputRaw.generated_files)" 
                                                            class="expand-image-btn">
                                                        <v-icon size="large">mdi-magnify-plus</v-icon>
                                                    </button>
                                                </div>
                                            </div>
                                            <div class="image-slide-indicators">
                                                <span v-for="(slide, index) in images" :key="index"
                                                    :class="['indicator', { active: index === imageIndex }]"
                                                    @click="goToImageSlide(index)"></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- 마크다운 결과 -->
                                <div v-else-if="isMarkdownType(item.payload.crewType)" 
                                    :class="['markdown-container', { 
                                    expanded: isTaskExpanded(item.payload.id),
                                    'has-expand-controls': shouldShowExpandControls(item.payload)
                                    }]"
                                    @dblclick="toggleTaskExpansion(item.payload.id)"
                                    v-html="getMarkdownContent(item.payload)"
                                ></div>

                                <!-- JSON 결과 -->
                                <div v-else class="pa-4"
                                    :class="['json-container', { 
                                        expanded: isTaskExpanded(item.payload.id),
                                        'has-expand-controls': shouldShowExpandControls(item.payload)
                                    }]"
                                    @dblclick="toggleTaskExpansion(item.payload.id)"
                                >
                                    <div>{{ formatJsonOutput(item.payload.content) }}</div>
                                </div>
                            </div>
                            <div v-if="shouldShowExpandControls(item.payload)" class="expand-controls">
                                <span class="expand-hint">
                                    {{ $t('EventTimeline.doubleClickHint') }} {{ isTaskExpanded(item.payload.id) ? $t('agentMonitor.collapse') : $t('agentMonitor.expand') }} {{ $t('EventTimeline.expandCollapse') }}
                                </span>
                                <button @click="toggleTaskExpansion(item.payload.id)" class="expand-button">
                                    {{ isTaskExpanded(item.payload.id) ? $t('agentMonitor.collapse') : $t('agentMonitor.expand') }}
                                    <span class="expand-icon">{{ isTaskExpanded(item.payload.id) ? '▲' : '▼' }}</span>
                                </button>
                            </div>
                        </div>

                        <!-- 진행 상태 -->
                        <div v-else-if="!item.payload.isCompleted" class="task-progress">
                            <div class="progress-dots">
                                <div class="dot"></div>
                                <div class="dot"></div>
                                <div class="dot"></div>
                            </div>
                            <span>{{ $t('agentMonitor.workInProgress') }}</span>
                        </div>

                        <!-- 도구 사용 상태 -->
                        <div v-if="getToolUsageList(item.payload.jobId).length" class="tool-usage-status-list">
                            <div v-for="(tool, idx) in getToolUsageList(item.payload.jobId)" :key="`${item.payload.jobId}-${tool.tool_name}-${idx}`" class="tool-usage-status-item">
                                <div class="tool-status-indicator">
                                    <div v-if="tool.status === 'searching'" class="loading-spinner"></div>
                                    <div v-else class="check-mark">✓</div>
                                </div>
                                <span>{{ getToolStatusText(tool) }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- 채팅 메시지 -->
                    <div v-else class="chat-message">
                        <div class="bubble">{{ item.payload.content }}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 이미지 확대 다이얼로그 -->
        <v-dialog v-model="imageDialog.show" max-width="90vw" max-height="90vh" persistent>
            <v-card class="image-dialog-card">
                <v-card-title class="image-dialog-header">
                    <div class="dialog-title">
                        <h3>{{ $t('EventTimeline.imageGallery') }}</h3>
                        <span class="dialog-counter">{{ imageIndex + 1 }} / {{ images.length }}</span>
                    </div>
                    <v-btn icon @click="closeImageDialog">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-card-title>
                
                <v-card-text class="image-dialog-content">
                    <div class="dialog-image-container">
                        <button @click="previousImageSlide()" 
                                :disabled="imageIndex === 0" 
                                class="dialog-nav-btn dialog-nav-left">
                            <v-icon>mdi-chevron-left</v-icon>
                        </button>
                        
                        <div class="dialog-image-wrapper">
                            <img v-if="images[imageIndex]" 
                                :src="images[imageIndex].src" 
                                :alt="images[imageIndex].alt" 
                                class="dialog-image" />
                        </div>
                        
                        <button @click="nextImageSlide()" 
                                :disabled="imageIndex === images.length - 1" 
                                class="dialog-nav-btn dialog-nav-right">
                            <v-icon>mdi-chevron-right</v-icon>
                        </button>
                    </div>
                    
                    <div class="dialog-indicators">
                        <span v-for="(slide, index) in images" :key="index"
                            :class="['dialog-indicator', { active: index === imageIndex }]"
                            @click="goToImageSlide(index)"></span>
                    </div>
                </v-card-text>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import { marked } from 'marked'
import { parseFileDocument } from '@/utils/upstageParser'
import BackendFactory from '@/components/api/BackendFactory'

export default {
    props: {
        timeline: {
            type: Array,
            required: true
        },
        humanQueryAnswers: {
            type: Object,
            default: () => ({})
        },
        expandedTasks: {
            type: Object,
            default: () => ({})
        },
        slideIndexes: {
            type: Object,
            default: () => ({})
        },
        toolUsageStatusByTask: {
            type: Object,
            default: () => ({})
        },
        todoStatus: {
            type: Object,
            default: null
        },
        browserIframeUrl: {
            type: String,
            default: ''
        },
        // chat인포 관련
        howToUseInfo: {
            type: Object,
            default: null
        }
    },
    emits: ['update:humanQueryAnswers', 'update:expandedTasks', 'update:slideIndexes', 'onCancelHumanQuery', 'onConfirmHumanQuery', 'submitTask', 'previousSlide', 'nextSlide', 'goToSlide', 'toggleTaskExpansion', 'browserUseCompleted'],
    data() {
        return {
            isParseSuccess: false,
            imageIndex: 0,
            imageDialog: {
                show: false,
                files: null
            },
            images: [],
            processedBrowserUseTasks: new Set() // 이미 처리된 browser-use 작업 추적
        };
    },
    computed: {
        filteredFiles() {
            return (files) => {
                if (!files) return [];
                
                const fileEntries = Object.entries(files);
                const nonImageFiles = [];
                
                fileEntries.forEach(([fileName, fileData]) => {
                    if (!this.isImageFile(fileName)) {
                        nonImageFiles.push([fileName, fileData]);
                    }
                });
                
                // 이미지가 아닌 파일들만 반환
                return nonImageFiles;
            };
        }
    },
    watch: {
        timeline: {
            handler(newTimeline) {
                // 이미지 슬라이드가 표시될 때 이미지들 로드
                const browserUseTask = newTimeline.find(item => 
                    item.type === 'task' && 
                    item.payload.crewType === 'browser-use' && 
                    item.payload.isCompleted &&
                    item.payload.outputRaw?.generated_files
                );
                
                if (browserUseTask) {
                    this.images = this.getImageSlides(browserUseTask.payload.outputRaw.generated_files);
                    this.imageIndex = 0; // 첫 번째 이미지부터 시작
                }
            },
            deep: true,
            immediate: true
        }
    },
    methods: {
        /**
         * 파싱 결과를 fileData에 세팅
         */
        setParseResultToFileData(fileName, fileData, parseResult) {
            try {
                if (parseResult.success) {
                    // 파싱 성공
                    fileData.parsed_content = parseResult.text;
                    // fileData.parsed_markdown = parseResult.markdown;
                    // fileData.parsed_html = parseResult.html;
                    // fileData.parsed_source = parseResult.source;
                    // fileData.parsed_elements = parseResult.elements;
                    fileData.parsed_at = parseResult.parsedAt;
                    fileData.parsing = false;
                    
                    if (parseResult.cached) {
                        console.log(`✅ [EventTimeline] 캐시된 데이터 사용: ${fileName}`);
                    } else {
                        this.isParseSuccess = true;
                        console.log(`✅ [EventTimeline] 파싱 성공: ${fileName} (${parseResult.text?.length || 0} 문자)`);
                    }
                } else {
                    // 파싱 실패
                    fileData.parsed_error = parseResult.error;
                    fileData.parsing = false;
                    console.warn(`⚠️ [EventTimeline] 파싱 실패: ${fileName} - ${parseResult.error}`);
                }
            } catch (error) {
                console.error(`❌ [EventTimeline] 파싱 결과 세팅 실패: ${fileName}`, error);
                fileData.parsed_error = error.message;
                fileData.parsing = false;
            }
        },
        
        /**
         * 이벤트 데이터를 DB에 저장
         */
        async saveEventToDatabase(eventItem) {
            try {
                if (!eventItem.completedEventId) {
                    console.warn('[EventTimeline] 이벤트 ID가 없어 DB 저장을 건너뜁니다.');
                    return;
                }

                const backend = BackendFactory.createBackend();
                
                // outputRaw 전체를 data로 저장 (generated_files에 파싱 결과 포함됨)
                const eventData = {
                    id: eventItem.completedEventId,
                    job_id: eventItem.jobId,
                    data: eventItem.outputRaw // outputRaw에 generated_files가 포함되어 있고, 파싱 결과도 함께
                };
                
                console.log(`[EventTimeline] DB에 이벤트 저장 중... (ID: ${eventItem.id})`);
                
                await backend.putEvent(eventData);
                
                console.log(`✅ [EventTimeline] DB 저장 완료: ${eventItem.id}`);
                
            } catch (error) {
                console.error('❌ [EventTimeline] DB 저장 실패:', error);
            }
        },
        getTimelineKey(item, index) {
            return item.type + '-' + (item.type === 'task' ? item.payload.id : 'chat-' + index)
        },
        getTaskStatusClass(payload) {
            const baseClass = 'task-status'
            if (payload.isError) return [baseClass, 'error']
            if (!payload.isCompleted) return [baseClass, 'running']
            return [baseClass, payload.isCrewCompleted ? 'crew-completed' : 'completed']
        },
        getTaskMeta(payload) {
            const typeLabel = payload.isHumanAsked
                ? 'human asked'
                : payload.crewType
            return [
                { label: this.$t('EventTimeline.startTime'), value: this.formatTime(payload.startTime) },
                { label: this.$t('EventTimeline.requestType'), value: typeLabel }
            ]
        },
        isSubmittableTask(task) {
            return (
                (task.crewType === 'report' && task.jobId.includes('final_report_merge')) ||
                task.crewType === 'slide' ||
                task.crewType === 'text' ||
                task.crewType === 'result'
            )
        },
        shouldShowSubmitButton(payload) {
            return payload.isCompleted && 
                        this.isSubmittableTask(payload) &&
                        this.todoStatus?.agent_mode === 'DRAFT'
        },
        isMarkdownType(crewType) {
            return crewType === 'report' || crewType === 'action' || crewType === 'planning' || crewType === 'react' || crewType === 'browser-automation-agent'
        },
        shouldShowExpandControls(payload) {
            if (payload.crewType === 'slide') return false
            if (payload.crewType === 'report' || payload.crewType === 'action' || payload.crewType === 'planning') {
                return this.isContentLong(payload.content);
            }
            const rawJson = typeof payload.content === 'string' 
                ? payload.content 
                : JSON.stringify(payload.content, null, 2);
            return this.isContentLong(rawJson);
        },
        formatFileSize(bytes) {
            if (!bytes) return '';
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            if (bytes === 0) return '0 Bytes';
            const i = Math.floor(Math.log(bytes) / Math.log(1024));
            return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
        },
        formatMarkdownContent(content) {
            if (!content) return '';
            
            // URL을 링크로 변환 (http/https로 시작하는 URL, 더 정확한 패턴)
            let formatted = content.replace(/(https?:\/\/[^\s<>"']+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="content-link">$1</a>');
            
            // 마크다운을 HTML로 변환
            formatted = formatted
                .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
                .replace(/^##### (.*$)/gim, '<h5>$1</h5>')
                .replace(/^###### (.*$)/gim, '<h6>$1</h6>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code>$1</code>')
                .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
                .replace(/\n/g, '<br>');
            
            return formatted;
        },
        getToolUsageList(jobId) {
            return (!jobId || !this.toolUsageStatusByTask[jobId]) ? [] : this.toolUsageStatusByTask[jobId]
        },
        getToolStatusText(tool) {
            const status = tool.status === 'done' ? this.$t('EventTimeline.toolUsageComplete') : this.$t('EventTimeline.toolUsageInProgress')
            const detail = tool.query || tool.info
            return `${tool.tool_name} ${this.$t('EventTimeline.tool')} ${status}${detail ? ': ' + detail : ''}`
        },
        getHumanResultText(payload) {
            const status = String(payload?.humanResponse?.status || '').toUpperCase()
            if (status === 'APPROVED' || status === 'APPROVE') return this.$t('EventTimeline.approved')
            if (status === 'REJECTED') return this.$t('EventTimeline.rejected')
            return this.$t('EventTimeline.processed')
        },
        getHumanResultClass(payload) {
            const status = String(payload?.humanResponse?.status || '').toUpperCase()
            if (status === 'APPROVED' || status === 'APPROVE') return 'pill-approved'
            if (status === 'REJECTED') return 'pill-rejected'
            return 'pill-neutral'
        },
        getHumanResultDetail(payload) {
            const answer = payload?.humanResponse?.data?.answer
            const type = payload?.humanQueryData?.type
            if (!answer) return ''
            if (type === 'text' || type === 'select') return String(answer)
            return ''
        },
        getDisplayName(task) {
            if (task.isHumanAsked) {
                return this.$t('AgentSelectInfo.humanApproval.title')
            }
            const name = task.name?.trim()
            return (!name || name.toLowerCase() === 'unknown') ? task.role : task.name
        },
        getTaskDescription(task) {
            console.log('[EventTimeline] getTaskDescription 호출:', {
                taskId: task.id,
                taskDescription: task.taskDescription,
                goal: task.goal,
                crewType: task.crewType,
                hasTaskDescription: !!task.taskDescription
            })
            // task_description이 있으면 항상 표시
            if (task.taskDescription) {
                console.log('[EventTimeline] task_description 반환:', task.taskDescription)
                return task.taskDescription
            }
            console.log('[EventTimeline] goal 반환:', task.goal || 'Task')
            return task.goal || 'Task'
        },
        getStatusText(task) {
            if (!task.isCompleted) return this.$t('EventTimeline.inProgress');
            if (task.isError) return this.$t('EventTimeline.taskFailed');
            return task.isCrewCompleted ? this.$t('EventTimeline.allCompleted') : this.$t('EventTimeline.taskCompleted');
        },
        formatTime(timestamp) {
            return new Date(timestamp).toLocaleString('ko-KR', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        },
        isContentLong(content) {
            if (!content) return false
            const contentStr = String(content)
            return contentStr.length > 500 || contentStr.split('\n').length > 8
        },
        isTaskExpanded(taskId) {
            return this.expandedTasks[taskId] || false
        },
        toggleTaskExpansion(taskId) {
            this.$emit('toggleTaskExpansion', taskId)
        },
        getSlides(output) {
            if (!output) return [];
            const source = output;
            const sanitized = this.sanitizeOutput(source);
            return String(sanitized)
                .split(/^\s*---\s*$/gm)
                .filter(slide => slide.trim())
                .map(slide => this.formatOutput(slide.trim(), 'markdown'));
        },
        getSlideIndex(taskId) {
            return this.slideIndexes[taskId] || 0;
        },
        getCurrentSlide(task) {
            const slides = this.getSlides(task.content);
            return slides[this.getSlideIndex(task.id)] || '';
        },
        previousSlide(taskId) {
            this.$emit('previousSlide', taskId)
        },
        nextSlide(taskId) {
            this.$emit('nextSlide', taskId)
        },
        goToSlide(taskId, index) {
            this.$emit('goToSlide', taskId, index)
        },
        getImageSlides(files) {
            if (!files) return [];
            return Object.entries(files)
                .filter(([fileName]) => this.isImageFile(fileName))
                .map(([fileName, fileData]) => ({
                    fileName,
                    src: fileData.url || this.getImageSrc(fileData.content, fileName), // URL 우선, 없으면 content
                    alt: fileName
                }));
        },
        previousImageSlide() {
            if (this.images.length === 0) return;
            this.imageIndex = this.imageIndex > 0 ? this.imageIndex - 1 : this.images.length - 1;
        },
        nextImageSlide() {
            if (this.images.length === 0) return;
            this.imageIndex = this.imageIndex < this.images.length - 1 ? this.imageIndex + 1 : 0;
        },
        goToImageSlide(index) {
            if (index >= 0 && index < this.images.length) {
                this.imageIndex = index;
            }
        },
        openImageDialog(files) {
            this.imageDialog.show = true;
            this.imageDialog.files = files;
        },
        closeImageDialog() {
            this.imageDialog.show = false;
            this.imageDialog.files = null;
        },
        onCancelHumanQuery(task) {
            this.$emit('onCancelHumanQuery', task)
        },
        onConfirmHumanQuery(task) {
            this.$emit('onConfirmHumanQuery', task)
        },
        submitTask(task) {
            this.$emit('submitTask', task)
        },
        getMarkdownContent(task) {
            if (task.content && typeof task.content === 'object') {
                const keyValueText = this.convertJsonToKeyValue(task.content);
                if (keyValueText) {
                    return keyValueText.replace(/\n/g, '<br>');
                }
            }
            
            if (typeof task.content === 'string') {
                try {
                    const parsed = JSON.parse(task.content);
                    if (typeof parsed === 'object' && parsed !== null) {
                        const keyValueText = this.convertJsonToKeyValue(parsed);
                        if (keyValueText) {
                            return keyValueText.replace(/\n/g, '<br>');
                        }
                    }
                } catch {
                }
            }
            
            return this.formatMarkdownOutput(task.content);
        },
        formatJsonOutput(output) {
            const keyValueText = this.convertJsonToKeyValue(output);
            return keyValueText || this.formatOutput(output, 'json');
        },
        formatMarkdownOutput(output) {
            return this.formatOutput(output, 'markdown');
        },
        convertJsonToKeyValue(data, indent = '') {
            if (!data) return '';
            
            let obj = data;
            if (typeof data === 'string') {
                try {
                    obj = JSON.parse(data);
                } catch (e) {
                    return data;
                }
            }
            
            if (typeof obj !== 'object' || Array.isArray(obj)) {
                return JSON.stringify(obj, null, 2);
            }
            
            const lines = [];
            Object.keys(obj).forEach(key => {
                const value = obj[key];
                
                if (Array.isArray(value)) {
                    // 배열은 JSON 문자열로 그대로 표현 (객체 배열도 가독성 유지)
                    lines.push(`${indent}${key} : ${JSON.stringify(value, null, 2)}`);
                } else if (typeof value === 'object' && value !== null) {
                    lines.push(`${indent}${key} :`);
                    Object.keys(value).forEach(subKey => {
                        const subValue = value[subKey];
                        lines.push(`${indent}- ${subKey} : ${String(subValue)}`);
                    });
                } else {
                    lines.push(`${indent}${key} : ${String(value)}`);
                }
            });
            
            return lines.join('\n');
        },
        sanitizeOutput(output) {
            if (typeof output !== 'string') return output;
            let trimmed = output.trim();
            let loopCount = 0;
            while (loopCount < 10) {
                const beforeTrim = trimmed;
                trimmed = trimmed.replace(/^(```|~~~|""")[a-zA-Z0-9]*\s*\n([\s\S]*?)\n\1\s*$/gm, '$2').trim();
                if (beforeTrim === trimmed) break;
                loopCount++;
            }
            return trimmed;
        },
        formatOutput(output, type = 'json') {
            if (!output) return '';
            
            const isString = typeof output === 'string';
            
            if (type === 'json') {
                if (isString) {
                    const cleaned = this.cleanString(this.removeFences(output));
                    const parsed = this.parseJson(cleaned, cleaned);
                    return typeof parsed === 'object' ? JSON.stringify(parsed, null, 2) : cleaned;
                }
                return this.parseJson(output, JSON.stringify(output, null, 2));
            }
            
            if (type === 'markdown') {
                const sanitized = this.sanitizeOutput(output);
                const outputStr = typeof sanitized === 'object' ? JSON.stringify(sanitized, null, 2) : String(sanitized);
                const clean = this.cleanString(outputStr);
                try {
                    return marked(clean, { breaks: true, gfm: true });
                } catch {
                    return clean.replace(/\n/g, '<br>');
                }
            }
            
            return String(output);
        },
        cleanString(str) {
            return str.replace(/\\n/g, '\n').replace(/\\r/g, '').replace(/\\t/g, '  ').replace(/\\\\/g, '\\')
        },
        removeFences(str) {
            return str.replace(/^```[a-zA-Z0-9]*\s*/, '').replace(/```$/, '').trim();
        },
        parseJson(data, fallback = {}) {
            if (!data) return fallback;
            try {
                return typeof data === 'string' ? JSON.parse(data) : data;
            } catch {
                return fallback;
            }
        },
        formatDateTime(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        },
        openBrowserDialog(taskId) {
            this.$emit('open-browser-dialog', taskId);
        },
        isImageFile(fileName) {
            if (!fileName) return false;
            const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg'];
            const lowerFileName = fileName.toLowerCase();
            return imageExtensions.some(ext => lowerFileName.endsWith(ext));
        },
        getImageSrc(content, fileName) {
            if (!content) return '';
            // HTTP/HTTPS URL인 경우 그대로 반환 (Supabase Storage URL)
            if (content.startsWith('http://') || content.startsWith('https://')) {
                return content;
            }
            // 이미 data URL인 경우 그대로 반환
            if (content.startsWith('data:image/')) {
                return content;
            }
            // Base64 데이터인 경우 data URL로 변환 (하위 호환성)
            const mimeType = this.getMimeTypeFromFileName(fileName);
            return `data:${mimeType};base64,${content}`;
        },
        getMimeTypeFromFileName(fileName) {
            if (!fileName) return 'image/png';
            const lowerFileName = fileName.toLowerCase();
            if (lowerFileName.endsWith('.png')) return 'image/png';
            if (lowerFileName.endsWith('.jpg') || lowerFileName.endsWith('.jpeg')) return 'image/jpeg';
            if (lowerFileName.endsWith('.gif')) return 'image/gif';
            if (lowerFileName.endsWith('.webp')) return 'image/webp';
            if (lowerFileName.endsWith('.bmp')) return 'image/bmp';
            if (lowerFileName.endsWith('.svg')) return 'image/svg+xml';
            // 기본값은 PNG
            return 'image/png';
        },
        getFileMimeType(fileName, fileData) {
            // fileData에 mime_type이 있으면 사용
            if (fileData.mime_type) {
                return fileData.mime_type;
            }
            
            // 파일 확장자로 추정
            if (!fileName) return 'application/octet-stream';
            const lowerFileName = fileName.toLowerCase();
            
            // 문서 파일
            if (lowerFileName.endsWith('.pdf')) return 'application/pdf';
            if (lowerFileName.endsWith('.doc')) return 'application/msword';
            if (lowerFileName.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            if (lowerFileName.endsWith('.xls')) return 'application/vnd.ms-excel';
            if (lowerFileName.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            if (lowerFileName.endsWith('.ppt')) return 'application/vnd.ms-powerpoint';
            if (lowerFileName.endsWith('.pptx')) return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
            if (lowerFileName.endsWith('.hwp')) return 'application/x-hwp';
            
            // 텍스트 파일
            if (lowerFileName.endsWith('.txt')) return 'text/plain';
            if (lowerFileName.endsWith('.csv')) return 'text/csv';
            if (lowerFileName.endsWith('.json')) return 'application/json';
            if (lowerFileName.endsWith('.xml')) return 'application/xml';
            if (lowerFileName.endsWith('.html')) return 'text/html';
            if (lowerFileName.endsWith('.md') || lowerFileName.endsWith('.markdown')) return 'text/markdown';
            
            // 압축 파일
            if (lowerFileName.endsWith('.zip')) return 'application/zip';
            if (lowerFileName.endsWith('.rar')) return 'application/x-rar-compressed';
            if (lowerFileName.endsWith('.7z')) return 'application/x-7z-compressed';
            
            // 이미지 파일
            if (lowerFileName.endsWith('.png')) return 'image/png';
            if (lowerFileName.endsWith('.jpg') || lowerFileName.endsWith('.jpeg')) return 'image/jpeg';
            if (lowerFileName.endsWith('.gif')) return 'image/gif';
            if (lowerFileName.endsWith('.webp')) return 'image/webp';
            if (lowerFileName.endsWith('.bmp')) return 'image/bmp';
            if (lowerFileName.endsWith('.svg')) return 'image/svg+xml';
            
            // 기본값
            return 'application/octet-stream';
        },
        async createFileFromUrl(fileName, fileData) {
            try {
                if (!fileData.url) {
                    console.error('URL 데이터가 없습니다.');
                    return null;
                }
                
                console.log(`[EventTimeline] URL에서 파일 가져오기: ${fileName} from ${fileData.url}`);
                
                // URL에서 파일 다운로드
                const response = await fetch(fileData.url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                // Blob으로 변환
                const blob = await response.blob();
                
                // MIME 타입 결정 (응답 헤더 우선, 없으면 fileData에서)
                const mimeType = blob.type || fileData.mime_type || this.getFileMimeType(fileName, fileData);
                
                // File 객체 생성
                const file = new File([blob], fileName, {
                    type: mimeType,
                    lastModified: Date.now()
                });
                
                console.log(`File 객체 생성 완료: ${fileName} (${file.size} bytes, ${file.type})`);
                
                return file;
            } catch (error) {
                console.error('File 객체 생성 중 오류 발생:', fileName, error);
                return null;
            }
        },
        async downloadFile(fileName, fileData) {
            try {
                if (!fileData.url) {
                    console.error('URL 데이터가 없습니다.');
                    return;
                }
                
                console.log(`[EventTimeline] 파일 다운로드: ${fileName} from ${fileData.url}`);
                
                // URL에서 파일 가져오기
                const response = await fetch(fileData.url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const blob = await response.blob();
                
                // 다운로드 링크 생성 및 클릭
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                
                // 정리
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                
                console.log(`파일 다운로드 완료: ${fileName}`);
            } catch (error) {
                console.error('파일 다운로드 중 오류 발생:', error);
                alert('파일 다운로드에 실패했습니다.');
            }
        },
    }
}
</script>

<style scoped>
/* 타임라인 스타일 */
.timeline-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.timeline-item {
    position: relative;
}

.task-card {
    background: white;
    border-radius: 12px;
    border: 1px solid #e1e8ed;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    transition: all 0.2s ease;
    margin-bottom: 16px;
}

.task-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-color: #d1d9e0;
}

.task-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
}

.task-left {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    flex: 1;
}

.task-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #e8e8e8;
    font-weight: 600;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
}

.avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
}

.task-info {
    flex: 1;
    min-width: 0;
}

.task-title {
    font-size: 16px;
    font-weight: 600;
    color: #1d2129;
    margin: 0 0 4px 0;
    line-height: 1.3;
}

.task-description {
    font-size: 14px;
    color: #606770;
    margin: 0;
    line-height: 1.4;
    word-break: break-word;
}

.task-header-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}

.task-status {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 2px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    flex-shrink: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Malgun Gothic', '맑은 고딕', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

.task-status.completed {
    background: #e8f5e8;
    color: #2d7d32;
}

.task-status.crew-completed {
    background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
    color: white;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
    animation: completedPulse 2s ease-in-out;
}

.task-status.running {
    background: #fff3e0;
    color: #f57c00;
}

.task-status.error {
    background: #fee2e2;
    color: #b91c1c;
    border: 1px solid #fecaca;
}

.status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
}

.task-meta {
    display: flex;
    gap: 24px;
    margin-bottom: 16px;
    padding: 12px 0;
    border-top: 1px solid #f8fafb;
}

.meta-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.meta-label {
    font-size: 11px;
    font-weight: 500;
    color: #8a8d91;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.meta-value {
    font-size: 13px;
    font-weight: 500;
    color: #1d2129;
}

.task-result {
    background: #f8fafb;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e4e6ea;
}

.result-header {
    padding: 12px 16px;
    background: #f8fafb;
    border-bottom: 1px solid #e4e6ea;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.result-title {
    font-size: 13px;
    font-weight: 600;
    color: #1d2129;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.json-container {
    max-height: 400px;
    overflow: hidden;
    transition: max-height 0.3s ease;
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    font-size: 14px;
    color: #1d2129;
}

.json-container > div {
    white-space: pre-line;
}

.json-container.expanded {
    max-height: none;
}

.json-container:not(.expanded).has-expand-controls::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40px;
    background: linear-gradient(transparent, #f8fafb);
    pointer-events: none;
}

/* 슬라이드 컨테이너 스타일 */
.slides-container {
    background: #ffffff;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e4e6ea;
    min-height: 400px;
    display: flex;
    flex-direction: column;
}

.slides-header {
    background: linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%);
    color: white;
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.header-info h5 {
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 600;
}

.slide-hint {
    font-size: 12px;
    opacity: 0.8;
    font-weight: 400;
}

.slide-navigation {
    display: flex;
    align-items: center;
    gap: 12px;
}

.nav-btn {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.nav-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
}

.nav-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.slide-counter {
    font-size: 14px;
    font-weight: 500;
    min-width: 60px;
    text-align: center;
}

.slide-content {
    flex: 1;
    padding: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8f9fa;
    min-height: 300px;
    position: relative;
}

.slide-inner {
    width: 100%;
    text-align: center;
    animation: slideIn 0.4s ease-out;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.slide-inner :deep(h1) {
    font-size: 2.2rem;
    color: #2c3e50;
    margin-bottom: 1.2rem;
    font-weight: 700;
    background: linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.slide-inner :deep(h2) {
    font-size: 1.8rem;
    color: #34495e;
    margin-bottom: 1rem;
    font-weight: 600;
    border-bottom: 3px solid #60A5FA;
    padding-bottom: 0.5rem;
    display: inline-block;
}

.slide-inner :deep(h3) {
    font-size: 1.4rem;
    color: #7f8c8d;
    margin-bottom: 0.8rem;
    font-weight: 500;
}

.slide-inner :deep(p) {
    font-size: 1.1rem;
    line-height: 1.8;
    color: #2c3e50;
    margin-bottom: 1rem;
    max-width: 700px;
    margin-left: auto;
    margin-right: auto;
}

.slide-inner :deep(ul) {
    text-align: left;
    max-width: 600px;
    margin: 1.5rem auto;
    font-size: 1.1rem;
    line-height: 1.8;
}

.slide-inner :deep(li) {
    margin-bottom: 0.8rem;
    color: #34495e;
    position: relative;
    padding-left: 1.5rem;
}

.slide-inner :deep(li::before) {
    content: '•';
    color: #60A5FA;
    font-weight: bold;
    position: absolute;
    left: 0;
}

.slide-inner :deep(strong) {
    color: #e74c3c;
    font-weight: 600;
}

.slide-indicators {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 16px;
    background: #ffffff;
    border-top: 1px solid #e9ecef;
    gap: 8px;
}

.indicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #dee2e6;
    cursor: pointer;
    transition: all 0.3s ease;
}

.indicator:hover {
    background: #adb5bd;
    transform: scale(1.2);
}

.indicator.active {
    background: #60A5FA;
    transform: scale(1.3);
    box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
}

.task-progress {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    background: linear-gradient(90deg, #f8f9ff 0%, #f0f2ff 100%);
    border-radius: 8px;
    border: 1px solid #e1e8ff;
    font-size: 14px;
    color: #60A5FA;
    font-weight: 500;
}

.progress-dots {
    display: flex;
    gap: 4px;
}

.dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #60A5FA;
    animation: pulse 1.4s ease-in-out infinite both;
}

.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes pulse {
    0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
    40% { opacity: 1; transform: scale(1); }
}

/* 마크다운 출력 스타일 */
.markdown-container {
    max-height: 400px;
    overflow: hidden;
    transition: max-height 0.3s ease;
    position: relative;
    flex: 1;
    padding: 16px;
    min-height: 360px;
    font-size: 14px;
    line-height: 1.6;
    color: #1d2129;
}

.markdown-container.expanded {
    max-height: none;
}

.markdown-container:not(.expanded).has-expand-controls::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40px;
    background: linear-gradient(transparent, #f8fafb);
    pointer-events: none;
}

/* markdown-container 스타일과 하위 요소들 */
.markdown-container :deep(h1), .markdown-container :deep(h2), .markdown-container :deep(h3) {
    font-weight: 600;
    color: #1d2129;
    margin: 16px 0 8px 0;
    line-height: 1.3;
}

.markdown-container :deep(h1) { font-size: 20px; }
.markdown-container :deep(h2) { font-size: 18px; }
.markdown-container :deep(h3) { font-size: 16px; }

.markdown-container :deep(p) { margin: 8px 0; }
.markdown-container :deep(ul), .markdown-container :deep(ol) { margin: 8px 0; padding-left: 20px; }
.markdown-container :deep(li) { margin: 4px 0; }

.markdown-container :deep(pre) {
    background: #282c34;
    color: #abb2bf;
    padding: 16px;
    border-radius: 6px;
    overflow-x: auto;
    font-size: 13px;
    margin: 12px 0;
}

.markdown-container :deep(code) {
    background: #f1f3f4;
    color: #d73a49;
    padding: 2px 4px;
    border-radius: 3px;
    font-size: 13px;
    font-family: 'SF Mono', Monaco, monospace;
}

.markdown-container :deep(pre code) {
    background: transparent;
    color: inherit;
    padding: 0;
}

/* 더보기 컨트롤 스타일 */
.expand-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: #f8f9fa;
    border-top: 1px solid #e9ecef;
}

.expand-button {
    background: #ffffff;
    color: #1d2129;
    border: 1px solid #dee2e6;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 4px;
}

.expand-button:hover {
    background: #f8f9fa;
    color: #495057;
    border-color: #adb5bd;
}

.expand-icon {
    font-size: 11px;
    transition: transform 0.2s ease;
}

.expand-hint {
    font-size: 11px;
    color: #1d2129;
}

.tool-usage-status-list {
    margin-top: 8px;
    padding-left: 20px;
    border-left: 2px solid #e9ecef;
    max-height: 120px;
    overflow-y: auto;
}

.tool-usage-status-item {
    display: flex;
    align-items: center;
    font-size: 12px;
    color: #adb5bd;
    font-weight: 400;
    margin-bottom: 4px;
    padding-left: 8px;
    letter-spacing: -0.2px;
    position: relative;
}

.tool-usage-status-item::before {
    content: '—';
    position: absolute;
    left: -6px;
    color: #dee2e6;
    font-weight: bold;
}

.tool-status-indicator {
    width: 12px;
    height: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 8px;
    flex-shrink: 0;
}

.loading-spinner {
    width: 10px;
    height: 10px;
    border: 1.5px solid #e9ecef;
    border-top-color: #60A5FA;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.check-mark {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #4caf50;
    color: white;
    font-size: 8px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* 채팅 UI 스타일 */
.chat-message { 
    display: flex; 
    justify-content: flex-end; 
    margin: 16px 0; 
}

.bubble { 
    background: #e5e5ea; 
    border-radius: 12px; 
    padding: 8px 12px; 
    max-width: 70%; 
}

/* human_asked 카드 스타일 (블루톤, 가독성 향상) */
.human-query-input {
    background: #f8fafb; /* lighter than blue-50 */
    border: 1px solid #e4e6ea; /* blue-200 */
    border-radius: 10px;
    padding: 16px 16px 14px;
}

.query-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
}

.query-title {
    font-size: 13px;
    font-weight: 500;
    margin: 0;
}

.role-pill {
    font-size: 12px;
    color: #1e40af; /* blue-700 */
    background: #dbeafe; /* blue-100 */
    padding: 2px 10px;
    border-radius: 999px;
}

.query-content {
    margin-bottom: 14px;
}

.query-question {
    margin: 0 0 10px 0;
    line-height: 1.5;
    font-size: 14px;
    font-weight: 400;
    color: #1d2129;
}

.input-field { margin-top: 8px; }

.query-input, .query-select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #e4e6ea; /* blue-200 */
    border-radius: 25px;
    font-size: 14px;
    color: #1f2937; /* gray-800 */
    background: #ffffff;
}

.query-input:focus, .query-select:focus {
    outline: none;
    border-color: #60a5fa; /* blue-400 */
}

.confirm-hint {
    font-size: 13px;
    color: #1d4ed8; /* blue-700 */
    font-style: italic;
}

.query-completed {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-top: 6px;
}

.completed-pill {
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
}

.pill-approved { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
.pill-rejected { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
.pill-neutral { background: #e5e7eb; color: #374151; border: 1px solid #d1d5db; }

.completed-detail {
    font-size: 13px;
    color: #1f2937;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
    .task-card { padding: 16px; }
    .task-header { flex-direction: column; gap: 12px; align-items: stretch; }
    .task-header-right { justify-content: flex-start; }
    .task-status { align-self: flex-start; }
    .task-meta { flex-direction: column; gap: 12px; }
    .result-content { padding: 12px; }
    .slides-header { padding: 12px 16px; flex-direction: column; gap: 12px; text-align: center; }
    .slide-content { padding: 20px; }
    .slide-inner :deep(h1) { font-size: 1.8rem; }
    .slide-inner :deep(h2) { font-size: 1.4rem; }
    .slide-inner :deep(p) { font-size: 1rem; }
}

/* Browser Result Styles */
.browser-result {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin: 16px 0;
}

.browser-result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #dee2e6;
}

.browser-result-header h5 {
  margin: 0;
  color: #495057;
  font-size: 18px;
  font-weight: 600;
}

.browser-status {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

.browser-status.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.browser-summary,
.browser-tools,
.browser-engines,
.browser-time,
.browser-files {
  margin-bottom: 16px;
}

.browser-summary h6,
.browser-tools h6,
.browser-engines h6,
.browser-time h6,
.browser-files h6 {
  margin: 0 0 8px 0;
  color: #6c757d;
  font-size: 14px;
  font-weight: 600;
}

.summary-text {
  background: white;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  white-space: pre-line;
  font-size: 14px;
  line-height: 1.5;
}

.tools-list,
.engines-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tool-tag,
.engine-tag {
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid #bbdefb;
}

.time-text {
  font-size: 13px;
  font-weight: 500;
  color: #1d2129;
}

/* 파일 관련 스타일 */
.files-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 이미지 파일 스타일 */
.image-container {
  margin-top: 12px;
  text-align: center;
}

.file-image {
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  object-fit: contain;
  background: #f8f9fa;
  padding: 8px;
}

/* 이미지 슬라이드 스타일 */
.image-slides-container {
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e4e6ea;
  margin-top: 16px;
  min-height: 300px;
  display: flex;
  flex-direction: column;
}

.image-slides-header {
  background: linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%);
  color: white;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.image-slides-header .header-info h5 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
}

.image-slides-header .slide-hint {
  font-size: 12px;
  opacity: 0.8;
  font-weight: 400;
}

.image-slide-content {
  flex: 1;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  min-height: 250px;
  position: relative;
}

.image-slide-image {
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  object-fit: contain;
  background: white;
  padding: 8px;
  animation: slideIn 0.4s ease-out;
}

.image-slide-indicators {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  background: #ffffff;
  border-top: 1px solid #e9ecef;
  gap: 8px;
}

/* 이미지 확대 버튼 스타일 */
.image-wrapper {
  position: relative;
  display: inline-block;
}

.expand-image-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 1;
  transform: scale(1);
}

.expand-image-btn:hover {
  background: rgba(0, 0, 0, 0.9);
  transform: scale(1.1);
}

/* 이미지 다이얼로그 스타일 */
.image-dialog-card {
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
}

.image-dialog-header {
  background: linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%);
  color: white;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-title h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.dialog-counter {
  font-size: 14px;
  opacity: 0.9;
  margin-left: 12px;
}


.image-dialog-content {
  padding: 0;
  background: #f8f9fa;
}

.dialog-image-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  background: #000;
}

.dialog-image-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.dialog-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.dialog-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
}

.dialog-nav-btn:hover:not(:disabled) {
  background: white;
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.dialog-nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.dialog-nav-left {
  left: 20px;
}

.dialog-nav-right {
  right: 20px;
}

.dialog-indicators {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: #ffffff;
  gap: 12px;
}

.dialog-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #dee2e6;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dialog-indicator:hover {
  background: #adb5bd;
  transform: scale(1.2);
}

.dialog-indicator.active {
  background: #60A5FA;
  transform: scale(1.3);
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
}

.file-item {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  transition: box-shadow 0.2s ease;
}

.file-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.file-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f1f3f4;
}

.file-name {
  font-weight: 600;
  color: #495057;
  font-size: 14px;
  word-break: break-all;
  flex: 1;
  margin-right: 12px;
}

.file-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.file-size {
  font-size: 12px;
  color: #6c757d;
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
}

.file-parsing {
  margin-top: 12px;
  padding: 12px;
  background: #e3f2fd;
  border: 1px solid #90caf9;
  border-radius: 6px;
  display: flex;
  align-items: center;
  color: #1976d2;
  font-size: 13px;
}

.file-parsing .parsing-text {
  font-weight: 500;
}

.file-error {
  margin-top: 12px;
  padding: 12px;
  background: #ffebee;
  border: 1px solid #ef9a9a;
  border-radius: 6px;
  display: flex;
  align-items: center;
  color: #c62828;
  font-size: 13px;
}

.file-error .error-text {
  font-weight: 500;
}

.file-content {
  margin-top: 12px;
}

.file-content .markdown-container {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 12px;
  font-size: 13px;
  line-height: 1.5;
  max-height: 400px;
  overflow-y: auto;
  overflow-x: auto;
}

.file-content .markdown-container h1,
.file-content .markdown-container h2,
.file-content .markdown-container h3,
.file-content .markdown-container h4,
.file-content .markdown-container h5,
.file-content .markdown-container h6 {
  margin: 8px 0 4px 0;
  color: #495057;
}

.file-content .markdown-container h1 { font-size: 18px; }
.file-content .markdown-container h2 { font-size: 16px; }
.file-content .markdown-container h3 { font-size: 15px; }
.file-content .markdown-container h4 { font-size: 14px; }
.file-content .markdown-container h5 { font-size: 13px; }
.file-content .markdown-container h6 { font-size: 12px; }

.file-content .markdown-container strong {
  font-weight: 600;
  color: #495057;
}

.file-content .markdown-container em {
  font-style: italic;
  color: #6c757d;
}

.file-content .markdown-container code {
  background: #e9ecef;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.file-content .markdown-container pre {
  background: #f1f3f4;
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 8px 0;
}

.file-content .markdown-container pre code {
  background: none;
  padding: 0;
}

/* 링크 스타일 */
.file-content .markdown-container .content-link {
  color: #007bff !important;
  text-decoration: none;
  word-break: break-all;
  border-bottom: 1px solid transparent;
  transition: border-bottom-color 0.2s ease;
}

.file-content .markdown-container .content-link:hover {
  color: #0056b3 !important;
  text-decoration: none;
  border-bottom-color: #0056b3;
}

.file-content .markdown-container a {
  color: #007bff !important;
  text-decoration: none;
  word-break: break-all;
  border-bottom: 1px solid transparent;
  transition: border-bottom-color 0.2s ease;
}

.file-content .markdown-container a:hover {
  color: #0056b3 !important;
  text-decoration: none;
  border-bottom-color: #0056b3;
}

/* 스크롤바 스타일 */
.file-content .markdown-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.file-content .markdown-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.file-content .markdown-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.file-content .markdown-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Firefox 스크롤바 스타일 */
.file-content .markdown-container {
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f1f1f1;
}

/* 브라우저 자동화 에이전트 iframe 스타일 */
.browser-iframe-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

.iframe-header {
  background: linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%);
  color: white;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.iframe-header h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
}

.iframe-header p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.browser-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto -800px auto; /* 하단 마진 제거 */
  position: relative;
  overflow: hidden; /* 여백 숨김 */
}

.browser-iframe {
  width: 100%;
  height: 500px; /* 높이 대폭 줄임 */
  border: none;
  background: white;
  transform: scale(0.3); /* 30% 축소 */
  transform-origin: top left;
  width: 333%; /* 축소된 만큼 너비 조정 */
  height: 1200px; /* 축소된 만큼 높이 조정 */
}

/* Browser Preview Styles */
.browser-preview {
  position: relative;
  cursor: pointer;
}

.expand-overlay {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
}

.expand-btn {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.expand-btn:hover {
  background: rgba(0, 0, 0, 0.9);
}

/* Browser Dialog Styles */
.browser-dialog {
  height: 80vh;
}

.browser-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
}

.close-btn {
  margin-left: auto;
}

.browser-dialog-content {
  padding: 0;
  height: calc(80vh - 80px);
  overflow: hidden;
}

.browser-dialog-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
}
</style>