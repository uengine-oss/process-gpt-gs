// 마크다운 파일 로더 유틸리티

export class MarkdownLoader {
    constructor() {
        this.cache = new Map();
    }

    // frontmatter 파싱
    parseFrontmatter(content) {
        const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
        const match = content.match(frontmatterRegex);
        
        if (!match) {
            return {
                frontmatter: {},
                content: content
            };
        }

        const frontmatterText = match[1];
        const markdownContent = match[2];
        
        const frontmatter = {};
        frontmatterText.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length > 0) {
                const value = valueParts.join(':').trim().replace(/^['"]|['"]$/g, '');
                frontmatter[key.trim()] = value;
            }
        });

        return {
            frontmatter,
            content: markdownContent
        };
    }

    // 마크다운을 HTML로 변환
    parseMarkdown(content) {
        let result = content;
        
        // 코드블록을 가장 먼저 처리 (다른 마크다운 요소들이 간섭하지 않도록)
        result = result.replace(/```([\s\S]*?)```/g, (match, code) => {
            const cleanCode = code.trim();
            return `<pre style="background-color: #2d3748; color: #ffffff; border: 1px solid #4a5568; border-radius: 4px; padding: 16px; margin: 16px 0; font-family: 'Courier New', monospace; white-space: pre-wrap; overflow-x: auto;"><code style="background: none; padding: 0; font-size: 14px; line-height: 1.4; color: #ffffff;">${cleanCode}</code></pre>`;
        });
        
        // 이미지 처리
        result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
            
            // 이미지 경로 처리 - uengine-image 폴더 기준으로 변경
            let imageSrc = src;
            
            // 상대 경로인 경우 실제 uengine-image 폴더 기준으로 변환
            if (src.startsWith('../../uengine-image/')) {
                imageSrc = `/src/views/pages/landingpage/mainPage/uengine-image/${src.replace('../../uengine-image/', '')}`;
            } else if (src.startsWith('../uengine-image/')) {
                imageSrc = `/src/views/pages/landingpage/mainPage/uengine-image/${src.replace('../uengine-image/', '')}`;
            } else if (src.startsWith('uengine-image/')) {
                imageSrc = `/src/views/pages/landingpage/mainPage/uengine-image/${src.replace('uengine-image/', '')}`;
            }
            
            return `<img src="${imageSrc}" alt="${alt}" class="tutorial-markdown-img" />`;
        });
        
        // 테이블 처리
        result = this.parseTable(result);
        
        // 나머지 마크다운 처리
        result = result
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`(.+?)`/g, '<code>$1</code>');
        
        // 리스트 처리 - 간단한 방식
        // 순서가 있는 리스트 (1. 2. 3.) - 숫자 유지
        result = result.replace(/^(\d+)\.\s(.+)$/gm, '<li class="ordered-item" value="$1">$2</li>');
        
        // 일반 리스트 (- 항목) - 들여쓰기 없음
        result = result.replace(/^-\s(.+)$/gm, '<li class="unordered-item">$1</li>');
        
        // 모든 들여쓰기 레벨의 리스트 처리
        result = result.replace(/^(\s{8,})-\s(.+)$/gm, '<li class="sub-sub-unordered-item">$2</li>');
        result = result.replace(/^(\s{4,7})-\s(.+)$/gm, '<li class="sub-unordered-item">$2</li>');
        result = result.replace(/^(\s{1,3})-\s(.+)$/gm, '<li class="sub-unordered-item">$2</li>');
        
        // 순서가 있는 리스트를 <ol>로 감싸기 - OS별 줄바꿈 호환
        result = result.replace(/(<li class="ordered-item"[^>]*>.*?<\/li>[\s\r\n]*)+/gs, (match) => {
            const cleanMatch = match.replace(/ class="ordered-item"/g, '');
            return `<ol style="list-style-type: decimal !important; list-style-position: outside !important; padding-left: 30px !important; margin: 16px 0 !important; display: block !important;">${cleanMatch}</ol>`;
        });
        
        // 더 깊은 하위 리스트를 <ul>로 감싸기 (8+ 공백) - OS별 줄바꿈 호환
        result = result.replace(/(<li class="sub-sub-unordered-item">.*?<\/li>[\s\r\n]*)+/gs, (match) => {
            const cleanMatch = match.replace(/ class="sub-sub-unordered-item"/g, '');
            return `<ul style="list-style-type: disc !important; list-style-position: outside !important; padding-left: 60px !important; margin: 4px 0 !important; display: block !important;">${cleanMatch}</ul>`;
        });
        
        // 하위 리스트를 <ul>로 감싸기 (들여쓰기 적용) - OS별 줄바꿈 호환
        result = result.replace(/(<li class="sub-unordered-item">.*?<\/li>[\s\r\n]*)+/gs, (match) => {
            const cleanMatch = match.replace(/ class="sub-unordered-item"/g, '');
            return `<ul style="list-style-type: disc !important; list-style-position: outside !important; padding-left: 50px !important; margin: 8px 0 !important; display: block !important;">${cleanMatch}</ul>`;
        });
        
        // 일반 리스트를 <ul>로 감싸기 - OS별 줄바꿈 호환
        result = result.replace(/(<li class="unordered-item">.*?<\/li>[\s\r\n]*)+/gs, (match) => {
            const cleanMatch = match.replace(/ class="unordered-item"/g, '');
            return `<ul style="list-style-type: disc !important; list-style-position: outside !important; padding-left: 30px !important; margin: 16px 0 !important; display: block !important;">${cleanMatch}</ul>`;
        });
        
        result = result
            .replace(/\[(.+?)\]\((.+?)\)/g, (match, text, href) => {
                // 내부 튜토리얼 링크인 경우 클릭 이벤트로 처리
                if (!href.startsWith('http') && !href.startsWith('mailto:')) {
                    return `<a class="tutorial-link" data-target="${href}" style="color: #3b82f6; text-decoration: underline; cursor: pointer;">${text}</a>`;
                }
                // 외부 링크는 기본 처리
                return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
            })
            .replace(/\n\n/g, '</p><p>')
            .replace(/^(?!<[h\d|ul|ol|pre|img|a])(.+)$/gm, '<p>$1</p>')
            .replace(/<p><\/p>/g, '');
            
        return result;
    }



    // 테이블 파싱
    parseTable(content) {
        // 테이블 패턴 매칭 (헤더 | 구분선 | 데이터 행들)
        const tableRegex = /(\|.+\|\s*\n\|[-\s|:]+\|\s*\n(?:\|.+\|\s*\n?)*)/gm;
        
        return content.replace(tableRegex, (match) => {
            
            const lines = match.trim().split('\n');
            if (lines.length < 3) return match; // 최소 헤더, 구분선, 데이터 1행 필요
            
            let tableHTML = '<table style="border-collapse: collapse; width: 100%; margin: 16px 0; border: 1px solid #e5e7eb;">\n';
            
            // 헤더 처리
            const headerLine = lines[0];
            const headers = headerLine.split('|').map(h => h.trim()).filter(h => h);
            tableHTML += '<thead style="background-color: #f9fafb;">\n<tr>\n';
            headers.forEach(header => {
                tableHTML += `<th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left; font-weight: 600;">${header}</th>\n`;
            });
            tableHTML += '</tr>\n</thead>\n';
            
            // 데이터 행 처리 (구분선 제외하고 2행부터)
            tableHTML += '<tbody>\n';
            for (let i = 2; i < lines.length; i++) {
                const line = lines[i];
                if (line.trim()) {
                    const cells = line.split('|').map(c => c.trim()).filter(c => c);
                    tableHTML += '<tr>\n';
                    cells.forEach(cell => {
                        tableHTML += `<td style="border: 1px solid #e5e7eb; padding: 12px;">${cell}</td>\n`;
                    });
                    tableHTML += '</tr>\n';
                }
            }
            tableHTML += '</tbody>\n</table>\n';
            
            return tableHTML;
        });
    }

    // 마크다운 파일 로드 - 정적 import 방식으로 변경
    async loadMarkdownFile(fileName) {
        if (this.cache.has(fileName)) {
            return this.cache.get(fileName);
        }

        try {
            // 정적 import 매핑을 사용하여 마크다운 파일 로드
            const markdownData = await this.getStaticMarkdownContent(fileName);
            
            if (!markdownData) {
                return null;
            }
            
            const parsed = this.parseFrontmatter(markdownData);
            
            const result = {
                ...parsed.frontmatter,
                content: parsed.content,
                renderedContent: this.parseMarkdown(parsed.content),
                fileName: fileName
            };

            this.cache.set(fileName, result);
            return result;
        } catch (error) {
            return null;
        }
    }

    // fetch API를 사용한 마크다운 컨텐츠 로드
    async getStaticMarkdownContent(fileName) {
        try {
            // src 폴더의 마크다운 파일을 직접 fetch로 가져오기
            const response = await fetch(`/src/views/pages/landingpage/mainPage/tutorial/tutoria-contents/${fileName}`);
            
            if (!response.ok) {
                return null;
            }
            
            const content = await response.text();
            return content;
        } catch (error) {
            return null;
        }
    }

    // 튜토리얼 라우트 구조 정의
    getTutorialRoutes() {
        return {
            name: 'process-gpt',
            sections: [
                {
                    title: '시작하기',
                    items: [
                        {
                            path: '/process-gpt/',
                            title: 'Process GPT 소개',
                            markdownFile: 'index.md'
                        }
                    ]
                },
                {
                    title: '가이드',
                    items: [
                        {
                            path: '/process-gpt/admin-guide/',
                            title: '관리자 가이드',
                            markdownFile: 'admin-guide.md'
                        },
                        {
                            path: '/process-gpt/user-guide/',
                            title: '사용자 가이드',
                            markdownFile: 'user-guide.md'
                        },
                        {
                            path: '/process-gpt/ai-chat-guide/',
                            title: 'AI 채팅 가이드',
                            markdownFile: 'ai-chat-guide.md'
                        }
                    ]
                },
                {
                    title: 'AI를 활용한 프로세스 관리',
                    items: [
                        {
                            path: '/process-gpt/agent-knowledge/',
                            title: '에이전트 지식 관리',
                            markdownFile: 'agent-knowledge.md'
                        },
                        {
                            path: '/process-gpt/multi-agent/',
                            title: '멀티 에이전트',
                            markdownFile: 'multi-agent.md'
                        },
                        {
                            path: '/process-gpt/a2a-system/',
                            title: 'A2A 시스템',
                            markdownFile: 'a2a-system.md'
                        },
                        {
                            path: '/process-gpt/voice-chat/',
                            title: '음성 채팅',
                            markdownFile: 'voice-chat.md'
                        },
                        {
                            path: '/process-gpt/browser-use/',
                            title: '브라우저 사용',
                            markdownFile: 'browser-use.md'
                        },
                        {
                            path: '/process-gpt/process-marketplace/',
                            title: '프로세스 마켓플레이스',
                            markdownFile: 'process-marketplace.md'
                        },
                        {
                            path: '/process-gpt/simulation/',
                            title: '시뮬레이션',
                            markdownFile: 'simulation.md'
                        }
                    ]
                }
            ]
        };
    }

    // 라우트 구조 기반으로 메타데이터 가져오기
    async getAllMarkdownMetadata() {
        const routes = this.getTutorialRoutes();
        const metadata = [];

        for (const section of routes.sections) {
            for (let i = 0; i < section.items.length; i++) {
                const item = section.items[i];
                
                metadata.push({
                    fileName: item.markdownFile,
                    title: item.title,  // 라우트 구조의 title만 사용
                    section: section.title,
                    path: item.path, // 전체 path 사용
                    order: i + 1,
                    markdownFile: item.markdownFile
                });
            }
        }
        return metadata;
    }

    // 파일명에서 제목 자동 생성
    generateTitleFromFileName(fileName) {
        return fileName
            .replace('.md', '')
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    // 섹션별로 그룹화
    async getGroupedMetadata() {
        const metadata = await this.getAllMarkdownMetadata();
        const grouped = {};

        metadata.forEach(item => {
            if (!grouped[item.section]) {
                grouped[item.section] = [];
            }
            grouped[item.section].push(item);
        });

        return grouped;
    }
}

export default new MarkdownLoader();