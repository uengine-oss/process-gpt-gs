<template>
    <div class="tutorial-content">
        <div class="content-area" v-if="currentPage">
            <div class="content-header">
                <h1>{{ currentPage.title }}</h1>
                <div class="breadcrumb">
                    <span>튜토리얼</span>
                    <span class="separator">></span>
                    <span>{{ getSectionName(currentPage) }}</span>
                    <span class="separator">></span>
                    <span class="current">{{ currentPage.title }}</span>
                </div>
            </div>
            
            <div class="markdown-content" v-html="renderedContent" @click="handleContentClick"></div>
        </div>
    </div>
</template>

<script>
import markdownLoader from './utils/markdownLoader.js'

export default {
    name: 'TutorialContent',
    props: {
        currentPage: {
            type: Object,
            default: null
        },
        allPages: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            renderedContent: '',
            currentMarkdownData: null
        }
    },
    computed: {
        previousPage() {
            const currentIndex = this.findPageIndex(this.currentPage);
            return currentIndex > 0 ? this.allPages[currentIndex - 1] : null;
        },
        nextPage() {
            const currentIndex = this.findPageIndex(this.currentPage);
            return currentIndex < this.allPages.length - 1 ? this.allPages[currentIndex + 1] : null;
        }
    },
    watch: {
        currentPage: {
            immediate: true,
            handler(newPage) {
                if (newPage) {
                    this.loadMarkdownContent(newPage);
                }
            }
        },
        allPages: {
            immediate: true,
            handler(newPages) {
                // 현재 페이지가 없고 페이지 목록이 있으면 첫 번째 페이지를 자동 선택
                if (!this.currentPage && newPages && newPages.length > 0) {
                    this.$emit('page-selected', newPages[0]);
                }
            }
        }
    },
    methods: {
        async loadMarkdownContent(page) {
            try {
                // 마크다운 파일 로드
                const markdownData = await markdownLoader.loadMarkdownFile(page.markdownFile);
                
                if (markdownData) {
                    this.currentMarkdownData = markdownData;
                    this.renderedContent = markdownData.renderedContent;
                } else {
                    this.renderedContent = '<p>마크다운 컨텐츠 로드중입니다.</p>';
                    console.error('마크다운 파일을 찾을 수 없습니다:', page.markdownFile);
                }
            } catch (error) {
                console.error('마크다운 컨텐츠 로드 실패:', error);
                this.renderedContent = '<p>컨텐츠 로드 중 오류가 발생했습니다.</p>';
            }
        },
        getSectionName(page) {
            // 실제 페이지 데이터에서 섹션명을 가져옴
            return page.section || '기타';
        },
        findPageIndex(page) {
            return this.allPages.findIndex(p => p.path === page?.path);
        },
        navigatePage(page) {
            this.$emit('page-selected', page);
        },

        // 마크다운 콘텐츠 내 링크 클릭 처리
        handleContentClick(event) {
            let target = event.target;
            
            // 부모 요소들을 검사하여 tutorial-link 클래스를 가진 요소 찾기
            let linkElement = null;
            let currentElement = target;
            
            // 최대 5단계까지 부모 요소 검사
            for (let i = 0; i < 5; i++) {
                if (currentElement && currentElement.classList && currentElement.classList.contains('tutorial-link')) {
                    linkElement = currentElement;
                    break;
                }
                currentElement = currentElement.parentElement;
                if (!currentElement) break;
            }
            
            if (linkElement) {
                event.preventDefault();
                const targetPath = linkElement.getAttribute('data-target');
                
                if (targetPath) {
                    // 부모 컴포넌트로 링크 클릭 이벤트 전달
                    this.$emit('tutorial-link-clicked', targetPath);
                }
            }
        }
    }
}
</script>

<style scoped>
.tutorial-content {
    background: #fafafa;
    margin-left: 300px;
    min-height: 100vh;
}

.content-area {
    padding: 40px;
    max-width: 100%;
    margin: 0 auto;
}

.content-header {
    margin-bottom: 32px;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 16px;
}

.content-header h1 {
    font-size: 2rem;
    color: #1f2937;
    margin: 0 0 12px 0;
}

.breadcrumb {
    font-size: 0.875rem;
    color: #6b7280;
}

.breadcrumb .separator {
    margin: 0 8px;
    color: #d1d5db;
}

.breadcrumb .current {
    color: #3b82f6;
    font-weight: 500;
}

.markdown-content {
    line-height: 1.5;
    color: #374151;
}

.markdown-content :deep(h1) {
    font-size: 1.875rem;
    color: #1f2937;
    margin: 32px 0 16px 0;
    font-weight: 600;
}

.markdown-content :deep(h2) {
    font-size: 1.5rem;
    color: #1f2937;
    /* margin: 24px 0 12px 0; */
    font-weight: 600;
    border-bottom: 1px solid #e5e7eb;
    padding: 24px 0 4px 0;
}

.markdown-content :deep(h3) {
    font-size: 1.25rem;
    color: #1f2937;
    /* margin: 20px 0 12px 0; */
    font-weight: 600;
    padding: 20px 0 4px 0;
}

.markdown-content :deep(p) {
    margin: 12px 0;
    line-height: 1.5;
}

.markdown-content :deep(ul) {
    margin: 16px 0;
    padding-left: 20px;
    list-style-type: disc;
}

.markdown-content :deep(ol) {
    margin: 16px 0;
    padding-left: 20px;
    list-style-type: decimal;
}

.markdown-content :deep(li) {
    margin: 8px 0;
    line-height: 1.5;
}

.markdown-content :deep(a) {
    display: inline-block;
    padding-bottom: 24px;
}

.markdown-content :deep(.tutorial-link) {
    color: #3b82f6;
    text-decoration: underline;
    cursor: pointer;
    transition: color 0.2s ease;
}

.markdown-content :deep(.tutorial-link:hover) {
    color: #1d4ed8;
    text-decoration: none;
}

.markdown-content :deep(img),
.markdown-content :deep(.tutorial-markdown-img) {
    max-width: 60vw;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    margin: 8px 0px 48px 0px;
    display: block;
}

.markdown-content :deep(code) {
    background: #f3f4f6;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.875rem;
}

.markdown-content :deep(pre) {
    background: #2d3748 !important;
    color: #ffffff !important;
    padding: 16px !important;
    border-radius: 4px !important;
    border: 1px solid #4a5568 !important;
    overflow-x: auto !important;
    overflow-y: auto !important;
    margin: 16px 0 !important;
    font-family: 'Courier New', monospace !important;
    white-space: pre !important;
    max-width: 100% !important;
    width: 100% !important;
    display: block !important;
    box-sizing: border-box !important;
}

.markdown-content :deep(pre code) {
    background: none !important;
    padding: 0 !important;
    color: #ffffff !important;
    font-size: 14px !important;
    line-height: 1.4 !important;
}

.content-navigation {
    display: flex;
    justify-content: space-between;
    margin-top: 48px;
    padding-top: 24px;
    border-top: 1px solid #e5e7eb;
}

.nav-btn {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    max-width: 200px;
}

.nav-btn:hover {
    background: #f9fafb;
    border-color: #3b82f6;
    transform: translateY(-2px);
}

.prev-btn {
    margin-right: auto;
}

.next-btn {
    margin-left: auto;
}

.nav-arrow {
    font-size: 1.25rem;
    color: #3b82f6;
    margin: 0 8px;
}

.nav-text {
    display: flex;
    flex-direction: column;
    text-align: left;
}

.next-btn .nav-text {
    text-align: right;
}

.nav-label {
    font-size: 0.75rem;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 2px;
}

.nav-title {
    font-size: 0.875rem;
    color: #1f2937;
    font-weight: 500;
}

@media (max-width: 768px) {
    .tutorial-markdown-img {
        max-width: 90vw;
    }
    .tutorial-content {
        margin-left: 0;
        padding-top: 80px; /* 모바일 햄버거 버튼 공간 확보 */
    }
    
    .content-area {
        padding: 20px;
    }
    
    .content-navigation {
        flex-direction: column;
        gap: 12px;
    }
    
    .nav-btn {
        max-width: none;
        width: 100%;
    }
}
</style>
