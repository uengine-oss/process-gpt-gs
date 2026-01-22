<template>
    <div>
        <!-- 모바일 햄버거 버튼 -->

        <div class="tutorial-mobile-menu-button" @click="toggleMobileSidebar" v-show="isMobileView">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        </div>

        <!-- 모바일 오버레이 -->
        <div 
            class="mobile-overlay"
            v-if="isMobileSidebarOpen && isMobileView"
            @click="closeMobileSidebar"
        ></div>

        <!-- 사이드바 -->
        <div 
            class="tutorial-sidebar"
            :class="{ 
                'mobile-open': isMobileSidebarOpen && isMobileView,
                'mobile-closed': !isMobileSidebarOpen && isMobileView
            }"
        >
            <div class="sidebar-content">
            <div
                v-for="(section, index) in tutorialSections"
                :key="section.title"
                class="section-group"
                :class="{ 'border-bottom': index < tutorialSections.length - 1 }"
            >
                <h3 class="section-title">{{ section.title }}</h3>
                
                <ul class="page-list">
                    <li
                        v-for="page in section.items"
                        :key="page.path"
                        :class="getClassesForItem(page)"
                        @click="selectPage(page)"
                    >
                        <span
                            class="active-indicator"
                            :class="{ 'active': currentPage?.path === page.path }"
                        ></span>
                        <span class="page-title">{{ page.title }}</span>
                    </li>
                </ul>
            </div>
            </div>
        </div>
    </div>
</template>

<script>
import markdownLoader from './utils/markdownLoader.js'

export default {
    name: 'TutorialSidebar',
    props: {
        currentPage: {
            type: Object,
            default: null
        },
        sectionsData: {
            type: Object,
            default: () => ({})
        }
    },
    data() {
        return {
            isMobileSidebarOpen: false,
            windowWidth: window.innerWidth
        }
    },
    computed: {
        isMobileView() {
            return this.windowWidth <= 768;
        },
        tutorialSections() {
            const sections = [];
            Object.keys(this.sectionsData).forEach(sectionTitle => {
                const items = this.sectionsData[sectionTitle].map(item => ({
                    path: item.path, // 라우트 구조에서 정의된 path 사용
                    title: item.title,
                    markdownFile: item.fileName,
                    order: item.order
                }));
                
                sections.push({
                    title: sectionTitle,
                    items: items.sort((a, b) => a.order - b.order)
                });
            });
            
            // 이미 정렬된 순서로 온다 (라우트 구조에서 정의된 순서)
            return sections;
        }
    },
    methods: {
        selectPage(page) {
            this.$emit('page-selected', page);
            // 모바일에서 페이지 선택 시 사이드바 닫기
            if (this.isMobileView) {
                this.closeMobileSidebar();
            }
        },

        getClassesForItem(page) {
            return {
                'page-item': true,
                'active': this.currentPage?.path === page.path,
                'inactive': this.currentPage?.path !== page.path
            };
        },

        // 외부에서 페이지 선택할 수 있는 메서드
        selectPageByPath(targetPath) {
            // 모든 섹션에서 해당 경로의 페이지 찾기
            for (const section of this.tutorialSections) {
                const foundPage = section.items.find(item => {
                    // 1. 정확한 경로 매칭
                    if (item.path === targetPath) {
                        return true;
                    }
                    
                    // 2. 파일명 기반 매칭 (admin-guide.md -> admin-guide)
                    const fileBasedPath = item.markdownFile.replace('.md', '');
                    if (fileBasedPath === targetPath) {
                        return true;
                    }
                    
                    // 3. 경로 끝부분 매칭 (/process-gpt/admin-guide/ -> admin-guide)
                    const pathEndMatch = item.path.replace('/process-gpt/', '').replace(/\/+$/, '');
                    if (pathEndMatch === targetPath) {
                        return true;
                    }
                    
                    return false;
                });
                
                if (foundPage) {
                    this.selectPage(foundPage);
                    return true;
                }
            }
            return false;
        },

        // 모바일 사이드바 토글
        toggleMobileSidebar() {
            this.isMobileSidebarOpen = !this.isMobileSidebarOpen;
        },

        // 모바일 사이드바 닫기
        closeMobileSidebar() {
            this.isMobileSidebarOpen = false;
        },

        // 윈도우 리사이즈 핸들러
        handleResize() {
            this.windowWidth = window.innerWidth;
            // 데스크톱으로 변경시 모바일 사이드바 닫기
            if (!this.isMobileView) {
                this.closeMobileSidebar();
            }
        }
    },

    emits: ['page-selected', 'tutorial-link-clicked'],
    
    mounted() {
        // 윈도우 리사이즈 이벤트 리스너 등록
        window.addEventListener('resize', this.handleResize);
    },

    beforeDestroy() {
        // 윈도우 리사이즈 이벤트 리스너 제거
        window.removeEventListener('resize', this.handleResize);
    }
}
</script>

<style scoped>
.tutorial-sidebar {
    position: fixed;
    top: 70;
    left: 0;
    width: 300px;
    height: calc(100vh - 70px);
    background: #ffffff;
    border-right: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;
    z-index: 100;
}

.sidebar-header {
    padding: 20px;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
}

.sidebar-header h2 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
    color: #1f2937;
}



.sidebar-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px 0;
    max-height: calc(100vh - 80px);
}

.section-group {
    padding: 0 20px 16px 20px;
    margin-bottom: 16px;
}

.section-group.border-bottom {
    border-bottom: 1px solid #f3f4f6;
}

.section-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 12px 0;
    padding: 0;
    text-align: left;
}

.page-list {
    list-style: none;
    padding: 0;
    margin: 0;
    padding-left: 8px;
}

.page-item {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s ease;
    position: relative;
    margin-bottom: 2px;
}

.page-item.inactive:hover {
    background-color: #f9fafb;
    transform: translateX(4px);
    color: #3b82f6;
}

.page-item.active {
    background-color: #eff6ff;
    color: #3b82f6;
    font-weight: 500;
}

.active-indicator {
    position: absolute;
    left: -12px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: transparent;
    transition: all 0.2s ease;
}

.active-indicator.active {
    background: #3b82f6;
    transform: scale(1);
}

.page-title {
    font-size: 0.875rem;
    line-height: 1.25rem;
}

/* 스크롤바 스타일 */
.sidebar-content::-webkit-scrollbar {
    width: 6px;
}

.sidebar-content::-webkit-scrollbar-track {
    background: #f1f5f9;
}

.sidebar-content::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}

.sidebar-content::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* 모바일 햄버거 버튼 */
.tutorial-mobile-menu-button {
    position: fixed;
    top: 23px;
    right: 20px;
    z-index: 1000;
    font-size: 1.5rem;
    color: var(--text-color);
    cursor: pointer;
}

/* 모바일 오버레이 */
.mobile-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
}

@media (max-width: 768px) {
    .tutorial-sidebar {
        position: fixed;
        top: 0;
        left: -300px;
        width: 280px;
        height: 100vh;
        z-index: 1001;
        transition: left 0.3s ease;
        box-shadow: 2px 0 10px rgba(0,0,0,0.1);
    }
    
    .tutorial-sidebar.mobile-open {
        left: 0;
    }
    
    .tutorial-sidebar.mobile-closed {
        left: -300px;
    }



    .sidebar-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px 0;
        max-height: 100vh;
    }
    
    .section-group {
        padding: 0 16px 12px 16px;
    }
}

@media (min-width: 769px) {
    .mobile-overlay {
        display: none !important;
    }
}
</style>
