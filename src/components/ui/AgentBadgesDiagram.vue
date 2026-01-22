<template>
    <div v-if="show" class="profile-container" :class="{ 'mobile': isMobile }">
        <div class="profile-wrapper">
            <v-row class="profile-header ma-0 pa-4 pb-0">
                <span class="profile-title">{{ agentName }}</span>
                <div v-if="agentData && agentData.id"
                    class="ml-2"
                >
                    <div class="learning-buttons-item">
                        <v-btn @click="goToAgentChat"
                            color="primary"
                            variant="flat" 
                            class="rounded-pill"
                            density="compact"
                        >{{ $t('AgentBadgesDiagram.settings') }}
                        </v-btn>
                    </div>
                </div>
                <v-spacer></v-spacer>
                <v-row v-if="!isMobile" class="align-center">
                    <button @click="zoomOut" class="zoom-btn" :disabled="zoomLevel <= 0.5">-</button>
                    <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
                    <button @click="zoomIn" class="zoom-btn" :disabled="zoomLevel >= 2">+</button>
                </v-row>
                <v-btn @click="close"
                    class="ml-auto" 
                    variant="text" 
                    density="compact"
                    icon
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-row>
            <div class="diagram-container" v-if="!isMobile">
                <svg ref="profileDiagram" :width="svgWidth" :height="svgHeight" class="profile-svg">
                    <g ref="contentGroup" :transform="`scale(${zoomLevel}) translate(${(svgWidth/2) * (1-zoomLevel)/zoomLevel}, ${(svgHeight/2) * (1-zoomLevel)/zoomLevel})`"></g>
                </svg>
            </div>
            <div class="mobile-content" v-else>
                <!-- 모바일용 세로 배치 레이아웃 -->
                <div class="mobile-center">
                    <div class="mobile-profile-image">
                        <img v-if="agentData?.img" :src="agentData.img" :alt="agentName" class="profile-img" />
                        <div v-else class="profile-emoji">🤖</div>
                    </div>
                    <h3 class="agent-name">{{ agentName }}</h3>
                </div>
                
                <div class="mobile-sections">
                    <div v-for="section in mobileSections" :key="section.id" class="mobile-section">
                        <h4 class="section-title">{{ section.title }}</h4>
                        <div class="section-content">
                            <div v-for="item in section.content" :key="item" class="content-item">
                                {{ item }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        show: {
            type: Boolean,
            default: false,
        },
        agentData: {
            type: Object,
            default: () => ({}),
        },
    },
    data: () => ({
        d3: null,
        svg: null,
        simulation: null,
        linkElements: null,
        nodeElements: null,
        nodesData: [],
        linksData: [],
        isMobile: false,
        svgWidth: 420,
        svgHeight: 400,
        mobileSections: [],
        zoomLevel: 1
    }),
    computed: {
        agentName() {
            return this.agentData?.name || 'Agent';
        },
        agentType() {
            return this.agentData?.type || 'agent';
        },
        centerX() {
            return this.svgWidth / 2;
        },
        centerY() {
            return this.svgHeight / 2;
        }
    },
    watch: {
        show(newVal) {
            if (newVal) {
                this.$nextTick(async () => {
                    this.checkMobile();
                    this.adjustSize();
                    if (!this.isMobile) {
                        await this.loadD3();
                        this.initializeNodesData();
                        this.initializeSimulation();
                    } else {
                        this.initializeMobileData();
                    }
                });
            }
        },
        agentData: {
            handler() {
                if (this.show) {
                    if (!this.isMobile && this.d3) {
                        this.initializeNodesData();
                        this.updateSimulation();
                    } else if (this.isMobile) {
                        this.initializeMobileData();
                    }
                }
            },
            deep: true
        }
    },
    mounted() {
        this.checkMobile();
        window.addEventListener('resize', this.handleResize);
    },
    beforeUnmount() {
        window.removeEventListener('resize', this.handleResize);
    },
    methods: {
        checkMobile() {
            this.isMobile = window.innerWidth <= 768;
        },
        adjustSize() {
            if (this.isMobile) return;
            
            // 450px 너비에 맞춰 SVG 크기 조정
            this.svgWidth = 420;
            this.svgHeight = 400;
        },
        handleResize() {
            this.checkMobile();
            this.adjustSize();
            
            if (this.show && !this.isMobile && this.simulation) {
                this.initializeSimulation();
            }
        },
        initializeMobileData() {
            this.mobileSections = [];
            
            // 페르소나 (실제 데이터)
            const personaInfo = [];
            if (this.agentData?.persona) personaInfo.push(this.agentData.persona);
            
            if (personaInfo.length > 0) {
                this.mobileSections.push({
                    id: 'persona',
                    title: this.$t('AgentBadgesDiagram.persona'),
                    content: personaInfo
                });
            }

            // 툴 & 스킬 (실제 데이터)
            const toolsInfo = [];
            if (this.agentData?.tools) {
                // 쉼표로 구분된 문자열이면 분리하여 각각 별도 줄로 표시
                if (typeof this.agentData.tools === 'string') {
                    const tools = this.agentData.tools.split(',').map(tool => tool.trim());
                    toolsInfo.push(...tools);
                } else if (Array.isArray(this.agentData.tools)) {
                    toolsInfo.push(...this.agentData.tools);
                } else {
                    toolsInfo.push(this.agentData.tools);
                }
            }
            
            if (toolsInfo.length > 0) {
                this.mobileSections.push({
                    id: 'tools',
                    title: this.$t('AgentBadgesDiagram.tools'),
                    content: toolsInfo
                });
            }

            // 지식 온톨로지 (하드코딩)
            const knowledgeInfo = ['비즈니스 프로세스 분석', '요구사항 정의', '워크플로우 최적화', '데이터 모델링'];
            this.mobileSections.push({
                id: 'knowledge',
                title: this.$t('AgentBadgesDiagram.knowledge'),
                content: knowledgeInfo
            });

            // 성과 & 뱃지 (하드코딩)
            const achievementInfo = ['완료된 프로젝트: 15개', '성공률: 94%', '전문 인증: ISO 9001'];
            this.mobileSections.push({
                id: 'achievements',
                title: this.$t('AgentBadgesDiagram.achievements'),
                content: achievementInfo
            });
        },
        async loadD3() {
            if (window.d3) {
                this.d3 = window.d3;
                return;
            }
            
            return new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js';
                script.onload = () => {
                    this.d3 = window.d3;
                    resolve();
                };
                document.head.appendChild(script);
            });
        },
        initializeNodesData() {
            this.nodesData = [
                {
                    id: 'center',
                    type: 'center',
                    title: '🤖',
                    content: [this.agentName, 'AI Assistant'],
                    size: 40,
                    x: this.centerX,
                    y: this.centerY,
                    fx: this.centerX,
                    fy: this.centerY
                }
            ];

            // 페르소나 (실제 데이터)
            const personaInfo = [];
            if (this.agentData?.persona) personaInfo.push(this.agentData.persona);
            
            if (personaInfo.length > 0) {
                this.nodesData.push({
                    id: 'persona',
                    type: 'callout',
                    title: this.$t('AgentBadgesDiagram.persona'),
                    content: personaInfo,
                    size: 25,
                    x: this.centerX + 90,
                    y: this.centerY - 60
                });
            }

            // 툴 & 스킬 (실제 데이터)
            const toolsInfo = [];
            if (this.agentData?.tools) {
                // 쉼표로 구분된 문자열이면 분리하여 각각 별도 줄로 표시
                if (typeof this.agentData.tools === 'string') {
                    const tools = this.agentData.tools.split(',').map(tool => tool.trim());
                    toolsInfo.push(...tools);
                } else if (Array.isArray(this.agentData.tools)) {
                    toolsInfo.push(...this.agentData.tools);
                } else {
                    toolsInfo.push(this.agentData.tools);
                }
            }
            
            if (toolsInfo.length > 0) {
                this.nodesData.push({
                    id: 'tools',
                    type: 'callout',
                    title: this.$t('AgentBadgesDiagram.tools'),
                    content: toolsInfo,
                    size: 25,
                    x: this.centerX - 60,
                    y: this.centerY - 90
                });
            }

            // 지식 온톨로지 (하드코딩)
            const knowledgeInfo = ['1024 노드', '3578 연결선', '레벨 3 (38%)'];
            this.nodesData.push({
                id: 'knowledge',
                type: 'callout',
                title: this.$t('AgentBadgesDiagram.knowledge'),
                content: knowledgeInfo,
                size: 25,
                x: this.centerX + 80,
                y: this.centerY + 80
            });

            // 성과 & 뱃지 (하드코딩)
            const achievementInfo = ['🥇 작업완료 x3', '⭐ 우수피드백 x7', '💡 창의적 솔루션 x12'];
            this.nodesData.push({
                id: 'achievements',
                type: 'callout',
                title: this.$t('AgentBadgesDiagram.achievements'),
                content: achievementInfo,
                size: 25,
                x: this.centerX - 100,
                y: this.centerY + 50
            });

            this.linksData = this.nodesData
                .filter(d => d.type === 'callout')
                .map(d => ({ source: 'center', target: d.id }));
        },
        initializeSimulation() {
            if (!this.$refs.profileDiagram || !this.d3) return;
            
            this.svg = this.d3.select(this.$refs.profileDiagram);
            
            // 중앙 노드의 위치를 확실히 고정
            const centerNode = this.nodesData.find(d => d.type === 'center');
            if (centerNode) {
                centerNode.x = this.centerX;
                centerNode.y = this.centerY;
                centerNode.fx = this.centerX;
                centerNode.fy = this.centerY;
            }
            
            this.simulation = this.d3.forceSimulation(this.nodesData)
                .force('link', this.d3.forceLink(this.linksData).id(d => d.id).distance(80))
                .force('charge', this.d3.forceManyBody().strength(-200))
                .force('center', this.d3.forceCenter(this.centerX, this.centerY))
                .force('collision', this.d3.forceCollide().radius(d => {
                    const size = this.calculateNodeSize(d);
                    return Math.max(size.width, size.height) / 2 + 8;
                }))
                .alphaTarget(0.1)
                .alphaDecay(0.02);

            this.createElements();
            
            this.simulation.on('tick', () => {
                this.updatePositions();
            });
        },
        updateSimulation() {
            if (!this.simulation) return;
            
            this.simulation.nodes(this.nodesData);
            this.simulation.force('link').links(this.linksData);
            this.createElements();
            this.simulation.alpha(0.5).restart();
        },
        calculateNodeSize(node) {
            if (node.type === 'center') return { width: 60, height: 60 };
            
            const maxWidth = 150;
            const charWidth = 7;
            const lineHeight = 14;
            const padding = 20;
            const titleHeight = 20;
            const bottomPadding = 10;
            
            // 제목 줄바꿈 계산
            const availableWidth = maxWidth - padding;
            const titleLines = Math.ceil((node.title.length * 8) / availableWidth);
            
            // 내용 줄바꿈 계산
            let totalContentLines = 0;
            node.content.forEach(line => {
                const lineWidth = line.length * charWidth;
                const linesNeeded = Math.ceil(lineWidth / availableWidth);
                totalContentLines += Math.max(1, linesNeeded);
            });
            
            const nodeHeight = titleHeight + (titleLines * lineHeight) + (totalContentLines * lineHeight) + bottomPadding;
            
            return {
                width: maxWidth,
                height: Math.max(70, nodeHeight)
            };
        },
        createElements() {
            // contentGroup 내부 요소들만 제거
            const contentGroup = this.d3.select(this.$refs.contentGroup);
            contentGroup.selectAll('*').remove();

            // 스타일 정의는 SVG 루트에
            const defs = this.svg.select('defs').empty() ? this.svg.append('defs') : this.svg.select('defs');
            
            if (defs.select('#drop-shadow').empty()) {
                const filter = defs.append('filter')
                    .attr('id', 'drop-shadow')
                    .attr('x', '-50%')
                    .attr('y', '-50%')
                    .attr('width', '200%')
                    .attr('height', '200%');
                
                filter.append('feDropShadow')
                    .attr('dx', 2)
                    .attr('dy', 2)
                    .attr('stdDeviation', 3)
                    .attr('flood-opacity', 0.1);
            }

            // 링크 생성 (contentGroup 내부에)
            this.linkElements = contentGroup.selectAll('.connection-line')
                .data(this.linksData)
                .enter()
                .append('line')
                .attr('class', 'connection-line');

            // 노드 그룹 생성 (contentGroup 내부에)
            const nodeGroups = contentGroup.selectAll('.node-group')
                .data(this.nodesData)
                .enter()
                .append('g')
                .attr('class', 'node-group')
                .call(this.d3.drag()
                    .on('start', this.dragstarted.bind(this))
                    .on('drag', this.dragged.bind(this))
                    .on('end', this.dragended.bind(this))
                );

            // 중앙 노드
            const centerNodes = nodeGroups.filter(d => d.type === 'center');
            
            centerNodes
                .append('circle')
                .attr('class', 'center-profile')
                .attr('r', d => d.size);

            // 중앙 노드에 프로필 이미지 추가 (이미지가 있을 경우)
            if (this.agentData?.img) {
                // 이미지용 클립패스 정의
                if (defs.select('#center-clip').empty()) {
                    defs.append('clipPath')
                        .attr('id', 'center-clip')
                        .append('circle')
                        .attr('r', 35)
                        .attr('cx', 0)
                        .attr('cy', 0);
                }

                centerNodes
                    .append('image')
                    .attr('class', 'center-image')
                    .attr('href', this.agentData.img)
                    .attr('x', -35)
                    .attr('y', -35)
                    .attr('width', 70)
                    .attr('height', 70)
                    .attr('clip-path', 'url(#center-clip)')
                    .style('cursor', 'default');
            } else {
                // 이미지가 없을 경우 기본 이모지 표시
                centerNodes
                    .append('text')
                    .attr('class', 'center-emoji')
                    .attr('text-anchor', 'middle')
                    .attr('dy', 8)
                    .attr('font-size', '28px')
                    .attr('fill', 'white')
                    .style('font-family', 'Apple Color Emoji, Segoe UI Emoji, sans-serif')
                    .style('cursor', 'default')
                    .text('🤖');
            }

            // 중앙 노드에 에이전트 이름 추가 (하단에)
            centerNodes
                .append('text')
                .attr('class', 'center-name')
                .attr('text-anchor', 'middle')
                .attr('dy', 55)
                .attr('font-size', '10px')
                .attr('fill', 'black')
                .attr('font-weight', 'bold')
                .text(d => this.agentName);

            // Callout 노드들
            const calloutGroups = nodeGroups.filter(d => d.type === 'callout');

            // Callout 박스
            calloutGroups
                .append('rect')
                .attr('class', 'callout-box')
                .attr('rx', 6)
                .on('mouseenter', (event, d) => this.highlightConnections(d.id))
                .on('mouseleave', () => this.unhighlightConnections());

            // Callout 제목
            calloutGroups
                .append('text')
                .attr('class', 'callout-title')
                .attr('text-anchor', 'middle')
                .each((d, i, nodes) => {
                    const text = this.d3.select(nodes[i]);
                    const size = this.calculateNodeSize(d);
                    const maxWidth = 130; // 150px - 20px padding
                    const title = d.title;
                    
                    // 박스 상단에서 15px 아래에 제목 위치
                    const startY = -size.height/2 + 15;
                    
                    if (title.length * 8 > maxWidth) {
                        // 긴 제목은 줄바꿈
                        const words = title.split(' ');
                        let line = [];
                        let lineNumber = 0;
                        
                        words.forEach(word => {
                            line.push(word);
                            const testLine = line.join(' ');
                            if (testLine.length * 8 > maxWidth && line.length > 1) {
                                line.pop();
                                text.append('tspan')
                                    .attr('x', 0)
                                    .attr('dy', lineNumber === 0 ? startY : 14)
                                    .text(line.join(' '));
                                line = [word];
                                lineNumber++;
                            }
                        });
                        
                        if (line.length > 0) {
                            text.append('tspan')
                                .attr('x', 0)
                                .attr('dy', lineNumber === 0 ? startY : 14)
                                .text(line.join(' '));
                        }
                    } else {
                        text.attr('dy', startY).text(title);
                    }
                });

            // Callout 내용
            calloutGroups.each((d, i, nodes) => {
                const group = this.d3.select(nodes[i]);
                const size = this.calculateNodeSize(d);
                const maxWidth = 130; // 150px - 20px padding
                
                // 제목 아래에서 시작 (언어별, 섹션별 마진 조정)
                let currentY = -size.height/2 + (this.$i18n.locale === 'en' && (d.id === 'knowledge' || d.id === 'achievements') ? 50 : 35);
                
                d.content.forEach((line) => {
                    if (line.length * 7 > maxWidth) {
                        // 긴 내용은 줄바꿈
                        const words = line.split(' ');
                        let currentLine = [];
                        
                        words.forEach(word => {
                            currentLine.push(word);
                            const testLine = currentLine.join(' ');
                            if (testLine.length * 7 > maxWidth && currentLine.length > 1) {
                                currentLine.pop();
                                group.append('text')
                                    .attr('class', 'callout-content')
                                    .attr('text-anchor', 'middle')
                                    .attr('dy', currentY)
                                    .text(currentLine.join(' '));
                                currentLine = [word];
                                currentY += 14;
                            }
                        });
                        
                        if (currentLine.length > 0) {
                            group.append('text')
                                .attr('class', 'callout-content')
                                .attr('text-anchor', 'middle')
                                .attr('dy', currentY)
                                .text(currentLine.join(' '));
                            currentY += 14;
                        }
                    } else {
                        group.append('text')
                            .attr('class', 'callout-content')
                            .attr('text-anchor', 'middle')
                            .attr('dy', currentY)
                            .text(line);
                        currentY += 14;
                    }
                });
            });

            this.nodeElements = nodeGroups;
        },
        updatePositions() {
            this.linkElements
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            this.nodeElements.attr('transform', d => `translate(${d.x},${d.y})`);

            this.nodeElements
                .filter(d => d.type === 'callout')
                .select('.callout-box')
                .attr('x', d => {
                    const size = this.calculateNodeSize(d);
                    return -size.width / 2;
                })
                .attr('y', d => {
                    const size = this.calculateNodeSize(d);
                    return -size.height / 2;
                })
                .attr('width', d => this.calculateNodeSize(d).width)
                .attr('height', d => this.calculateNodeSize(d).height);
        },
        highlightConnections(nodeId) {
            this.linkElements
                .classed('highlighted', d => d.source.id === nodeId || d.target.id === nodeId);
        },
        unhighlightConnections() {
            this.linkElements.classed('highlighted', false);
        },
        dragstarted(event, d) {
            if (!event.active) this.simulation.alphaTarget(0.3).restart();
            // 중앙 노드는 드래그하지 않음
            if (d.type === 'center') {
                d.fx = this.centerX;
                d.fy = this.centerY;
                return;
            }
            d.fx = d.x;
            d.fy = d.y;
        },
        dragged(event, d) {
            // 중앙 노드는 드래그하지 않음
            if (d.type === 'center') {
                d.fx = this.centerX;
                d.fy = this.centerY;
                return;
            }
            d.fx = event.x;
            d.fy = event.y;
        },
        dragended(event, d) {
            if (!event.active) this.simulation.alphaTarget(0);
            // 중앙 노드는 항상 중앙에 고정
            if (d.type === 'center') {
                d.fx = this.centerX;
                d.fy = this.centerY;
            } else {
                d.fx = null;
                d.fy = null;
            }
        },
        close() {
            this.$emit('close');
        },
        zoomOut() {
            if (this.zoomLevel > 0.5) {
                this.zoomLevel = Math.round((this.zoomLevel - 0.1) * 10) / 10;
            }
        },
        zoomIn() {
            if (this.zoomLevel < 2) {
                this.zoomLevel = Math.round((this.zoomLevel + 0.1) * 10) / 10;
            }
        },

        goToAgentChat() {
            this.$router.push(`/agent-chat/${this.agentData.id}`)
        },
    }
}
</script>

<style scoped>
/* 기본 데스크톱 스타일 */
.profile-container {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
}

.profile-wrapper {
    background: white !important;
    border-radius: 15px;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3), 0 5px 15px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    width: 450px;
    height: 480px;
}

/* 모바일 스타일 */
.profile-container.mobile {
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
}

.profile-container.mobile .profile-wrapper {
    width: 100%;
    max-width: 400px;
    height: auto;
    max-height: 100vh;
    overflow-y: auto;
}

.mobile-content {
    background: white;
    height: 94vh;
    overflow-y: auto;
    padding: 16px;
}

.mobile-center {
    text-align: center;
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid #eee;
}

.mobile-profile-image {
    width: 80px;
    height: 80px;
    margin: 0 auto 15px;
    border-radius: 50%;
    overflow: hidden;
    background: #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.mobile-profile-image .profile-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.mobile-profile-image .profile-emoji {
    font-size: 32px;
}

.agent-name {
    margin: 0;
    color: #333;
    font-size: 18px;
    font-weight: 600;
}

.mobile-sections {
    space-y: 15px;
}

.mobile-section {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 15px;
}

.section-title {
    margin: 0 0 10px 0;
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.section-content {
    space-y: 5px;
}

.content-item {
    background: white;
    padding: 8px 12px;
    border-radius: 6px;
    margin-bottom: 5px;
    font-size: 13px;
    color: #555;
    border: 1px solid #e9ecef;
}

.content-item:last-child {
    margin-bottom: 0;
}

.profile-header {
    align-items: center;
    background: white;
}

.profile-title {
    font-weight: 600;
    font-size: 14px;
    margin-top: 2px;
}

.header-controls {
    display: flex;
    align-items: center;
    gap: 8px;
}

.zoom-controls {
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 4px 8px;
}

.zoom-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 50%;
    transition: all 0.2s;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 4px;
}

.zoom-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
}

.zoom-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.zoom-level {
    font-size: 11px;
    font-weight: 600;
    min-width: 35px;
    text-align: center;
}

.close-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    font-size: 14px;
    cursor: pointer;
    padding: 6px 8px;
    border-radius: 50%;
    transition: all 0.2s;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.close-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
}

.diagram-container {
    background: rgba(255, 255, 255, 0.95);
    margin: 15px;
    border-radius: 10px;
    height: calc(100% - 80px);
    overflow: hidden;
}

.learning-buttons {
    position: fixed;
    bottom: 44px;
    right: 44px;
    z-index: 1000;
}

.profile-svg {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 12px;
    border: 1px solid #ccc;
}

/* D3.js 스타일 */
.profile-svg :deep(.callout-box) {
    fill: white;
    stroke: #ddd;
    stroke-width: 1;
    filter: drop-shadow(1px 1px 3px rgba(0,0,0,0.1));
    cursor: pointer;
    transition: all 0.3s ease;
}

.profile-svg :deep(.callout-box:hover) {
    fill: #f8f9fa;
    stroke: #667eea;
    stroke-width: 2;
}

.profile-svg :deep(.callout-title) {
    font-weight: bold;
    fill: #2d3436;
    font-size: 11px;
    text-anchor: middle;
    pointer-events: none;
}

.profile-svg :deep(.callout-content) {
    fill: #636e72;
    font-size: 9px;
    text-anchor: middle;
    pointer-events: none;
}

.profile-svg :deep(.connection-line) {
    stroke: #667eea;
    stroke-width: 2;
    fill: none;
    opacity: 0.6;
}

.profile-svg :deep(.connection-line.highlighted) {
    stroke: #764ba2;
    stroke-width: 3;
    opacity: 1;
}

.profile-svg :deep(.center-profile) {
    fill: #667eea;
    stroke: white;
    stroke-width: 3;
    filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.2));
    cursor: default;
    transition: fill 0.2s;
}

.profile-svg :deep(.center-profile:hover) {
    fill: #764ba2;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateX(100%);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@media only screen and (max-width: 768px) {
    .learning-buttons {
        display: none;
    }
}

</style> 