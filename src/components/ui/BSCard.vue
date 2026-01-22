<template>

  <v-card elevation="10">
      <AppBaseCard>
          <template v-slot:leftpart>
              <Chat :name="$t(chatInfo.title)"
                  :messages="messages"
                  :chatInfo="chatInfo"
                  :userInfo="userInfo" 
                  :disableChat="disableChat"
                  @sendMessage="beforeSendMessage"
                  @sendEditedMessage="sendEditedMessage"
                  @stopMessage="stopMessage"
              ></Chat>
          </template>

          <template v-slot:rightpart>
            <div class="pa-3 mb-0 d-flex flex-wrap gap-2 justify-end">
                <v-tooltip bottom>
                    <template v-slot:activator="{ props }">
                        <v-btn size="30"
                          elevation="2"
                          v-bind="props"
                          @click="deleteDialog = true"
                        >
                          <TrashIcon size="20" class="text-error" />
                        </v-btn>
                    </template>
                    <span>{{ $t('BSCard.deleteStrategy') }}</span>
                </v-tooltip>
                <v-tooltip bottom>
                    <template v-slot:activator="{ props }">
                        <v-btn size="30" elevation="2" v-bind="props" @click="editDialog = true">
                            <v-icon size="small">mdi-pencil</v-icon>
                        </v-btn>
                    </template>
                    <span>{{ $t('BSCard.editStrategy') }}</span>
                </v-tooltip>
                <v-tooltip bottom>
                    <template v-slot:activator="{ props }">
                        <v-btn color="primary" size="30" elevation="2" v-bind="props" @click="addDialog = true">
                            <v-icon size="small">mdi-plus</v-icon>
                        </v-btn>
                    </template>
                    <span>{{ $t('BSCard.addStrategy') }}</span>
                </v-tooltip>
                <!-- <v-tooltip bottom>
                    <template v-slot:activator="{ props }">
                        <v-btn size="30" elevation="2" v-bind="props" @click="connectionDialog = true">
                            <v-icon size="small">mdi-link</v-icon>
                        </v-btn>
                    </template>
                    <span>연결 추가</span>
                </v-tooltip> -->
                <!-- <v-btn @click="onZoomIn">확대</v-btn>
              <v-btn @click="onZoomOut">축소</v-btn>
              <v-btn @click="onResetView">초기화</v-btn> -->
            </div>
            <div v-if="isMobile" class="pa-2 d-flex flex-wrap gap-2 align-center">
              <div class="d-flex align-center gap-1">
                <div class="legend-color" style="background: #FA896B"></div> {{$t('BSCard.finance')}}
              </div>
              <div class="d-flex align-center gap-1">
                <div class="legend-color" style="background: #0074BA"></div> {{$t('BSCard.customer')}}
              </div>
              <div class="d-flex align-center gap-1">
                <div class="legend-color" style="background: #01C0C8"></div> {{$t('BSCard.process')}}
              </div>
              <div class="d-flex align-center gap-1">
                <div class="legend-color" style="background: #763EBD"></div> {{$t('BSCard.learning')}}
              </div>
            </div>
            <div class="d-flex flex-wrap gap-2" style="width: 100%; height: 100%;">
              <div ref="container" class="strategy-map-container" style="width: 100%; height: 100%;" v-hammer:pan="onPan" v-hammer:pinch="onPinch">
              </div>
            </div>
          </template>

          <template v-slot:mobileLeftContent>
              <Chat :name="$t(chatInfo.title)"
                  :messages="messages"
                  :chatInfo="chatInfo"
                  :userInfo="userInfo" 
                  :disableChat="disableChat"
                  @sendMessage="beforeSendMessage"
                  @sendEditedMessage="sendEditedMessage"
                  @stopMessage="stopMessage"
              ></Chat>
          </template>
      </AppBaseCard>
  </v-card>

  
  <v-dialog v-model="deleteDialog" max-width="400">
    <v-card>
      <v-card-title class="text-h6">{{ $t('BSCard.deleteStrategyDialog') }}</v-card-title>
      <v-card-text>
        <v-select
          v-model="selectedStrategy"
          :items="strategyOptions"
          item-title="name"
          item-value="id"
          :label="$t('BSCard.selectStrategyToDelete')"
          variant="outlined"
          return-object
          :item-props="getItemProps"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="deleteDialog = false" variant="text">{{ $t('BSCard.cancel') }}</v-btn>
        <v-btn @click="confirmDeleteStrategy" color="red" variant="flat" :disabled="!selectedStrategy">
          {{ $t('BSCard.delete') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="addDialog" max-width="500">
    <v-card>
      <v-row class="ma-0 pa-4">
        <v-card-title class="text-h6 pa-0">{{ $t('BSCard.addStrategyDialog') }}</v-card-title>
        <v-spacer></v-spacer>
          <v-btn @click="addDialog = false"
            class="ml-auto"
            variant="text"
            density="compact"
            icon
          >
              <v-icon>mdi-close</v-icon>
          </v-btn>
      </v-row>

      <v-card-text class="pa-4 pb-0">
        <v-select
          v-model="strategyForm.perspective"
          :items="perspectives"
          item-title="label"
          item-value="id"
          :label="$t('BSCard.perspective')"
          variant="outlined"
          dense
          required
          :item-props="getPerspectiveProps"
        />

        <v-select
          v-model="strategyForm.parents"
          :items="upperStrategyOptions(null, strategyForm.perspective)"
          item-title="name"
          item-value="id"
          :label="$t('BSCard.selectUpperStrategy')"
          multiple
          variant="outlined"
          chips
          :item-props="getItemProps"
        />

        <v-text-field
          v-model="strategyForm.name"
          :label="$t('BSCard.strategyName')"
          variant="outlined"
          dense
          required
        />


        <v-textarea
          v-model="strategyForm.description"
          :label="$t('BSCard.description')"
          variant="outlined"
          auto-grow
          rows="2"
          max-rows="4"
        />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
          <v-btn @click="saveStrategy"
            :disabled="!strategyForm.name || !strategyForm.perspective"
            color="primary"
            variant="flat"
            rounded
          >{{ $t('BSCard.save') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="editDialog" max-width="500">
    <v-card>
      <v-row class="ma-0 pa-4">
        <v-card-title class="text-h6 pa-0">{{ $t('BSCard.editStrategyDialog') }}</v-card-title>
        <v-spacer></v-spacer>
          <v-btn @click="editDialog = false"
            class="ml-auto"
            variant="text"
            density="compact"
            icon
          >
              <v-icon>mdi-close</v-icon>
          </v-btn>
      </v-row>

      <v-card-text class="pa-4 pb-0">
        <v-select
          v-model="selectedStrategy"
          :items="strategyOptions"
          v-model:menu="strategyMenu"
          item-title="name"
          item-value="id"
          :label="$t('BSCard.selectStrategyToEdit')"
          variant="outlined"
          return-object
          @update:model-value="strategyMenu = false"
          :item-props="getItemProps"
        />

        <v-select
          v-model="editForm.parents"
          :items="upperStrategyOptions(selectedStrategy)"
          item-title="name"
          item-value="id"
          :label="$t('BSCard.selectUpperStrategy')"
          multiple
          variant="outlined"
          chips
          :item-props="getItemProps"
        />
        <v-text-field
          v-model="editForm.name"
          :label="$t('BSCard.strategyName')"
          variant="outlined"
          dense
        />

        <v-textarea
          v-model="editForm.description"
          :label="$t('BSCard.description')"
          variant="outlined"
          auto-grow
          rows="2"
          max-rows="4"
        />

      </v-card-text>


      <v-card-actions>
        <v-spacer />
          <v-btn @click="saveEditedStrategy"
            color="primary"
            variant="flat"
            rounded
          >{{ $t('BSCard.save') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
<v-dialog v-model="connectionDialog" max-width="500">
  <v-card>
    <v-card-title class="text-h6 text-center">{{ $t('BSCard.addConnectionDialog') }}</v-card-title>

    <v-card-text>
      <v-select
        v-model="selectedConnectionSource"
        :items="strategyOptions"
        item-title="name"
        item-value="id"
        :label="$t('BSCard.sourceStrategy')"
        variant="outlined"
        return-object
        class="mb-3"
        :item-props="getItemProps"
      />

      <v-select
        v-model="selectedConnectionTarget"
        :items="strategyOptions"
        item-title="name"
        item-value="id"
        :label="$t('BSCard.targetStrategy')"
        variant="outlined"
        return-object
        :item-props="getItemProps"
      />
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <v-btn @click="connectionDialog = false" variant="outlined" color="grey">{{ $t('BSCard.cancel') }}</v-btn>
      <v-btn
        @click="confirmAddConnection"
        variant="flat"
        color="primary"
        :disabled="!selectedConnectionSource || !selectedConnectionTarget || selectedConnectionSource.id === selectedConnectionTarget.id"
      >
        {{ $t('BSCard.addConnectionBtn') }}
      </v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>


</template>
  
  <script>
  import Diagram from 'diagram-js';
  import 'diagram-js/assets/diagram-js.css';
  import ChatGenerator from '@/components/ai/BSGenerator.js';
  import modelingModule from 'diagram-js/lib/features/modeling';
  import CustomRenderer from '@/components/diagram/CustomRenderer';
  import CustomMoveRules from '@/components/diagram/CustomMoveRules';
  import connectModule from 'diagram-js/lib/features/connect';
  import ChatModule from "@/components/ChatModule.vue";
  import AppBaseCard from '@/components/shared/AppBaseCard.vue';
  import Chat from "@/components/ui/Chat.vue";
  import ZoomScroll from '@/components/customZoomScroll';
  import BpmnModeler from 'bpmn-js/lib/Modeler';
  import BackendFactory from '@/components/api/BackendFactory';

  const backend = BackendFactory.createBackend();
  
  export default {
    name: 'StrategyMap',
    mixins: [ChatModule],
    components: {
      AppBaseCard,
      ChatModule,
      Chat
    },
    computed: {
      isMobile() {
          const container = this.$refs.container;
          if (!container) return false;

          const { width, height } = container.getBoundingClientRect();

          return width - 100 < height;
      },
    },
    data() {
      return {
        diagram: null,
        elements: [],
        elementId: 1,
        chatInfo: {
            title: "BSCard.cardTitle",
            text: "BSCard.description"
        },
        perspectives: [],
        jsonData: {
          strategies: [
            {
              "id": "s1",
              "name": "매출 20% 성장",
              "description": "전년도 대비 전체 매출을 20% 성장시키는 것이 목표",
              "perspective": "financial",
              "parents": []
            },
            {
              "id": "s2",
              "name": "고객 만족도 90점 이상 달성",
              "description": "NPS 기준 고객 만족도를 90점 이상으로 유지",
              "perspective": "customer",
              "parents": ["s1"]
            },
            {
              "id": "s3",
              "name": "프로세스 자동화율 50% 달성",
              "description": "내부 업무 프로세스 중 50% 이상을 자동화 시스템으로 전환",
              "perspective": "internal_process",
              "parents": ["s2"]
            },
            {
              "id": "s4",
              "name": "직원 역량 강화 프로그램 운영",
              "description": "전 직원 대상 연 2회 이상 역량 강화 교육 진행",
              "perspective": "learning_growth",
              "parents": ["s3"]
            }
          ],
        },
        defaultStrategyWidth: 140,
        defaultStrategyHeight: 70,
        strategyScale: 1,
        maxStrategyScale: 2,
        minStrategyScale: 0.5,
        deleteDialog: false,
        selectedStrategy: null,
        addDialog: false,
        strategyForm: {
          name: '',
          perspective: '',
          description: '',
          parents: []
        },
        editDialog: false,
        editForm: {
          id: null,
          name: '',
          description: '',
          parents: []
        },
        connectionDialog: false,
        selectedConnectionSource: null,
        selectedConnectionTarget: null,
        newMessage: null,
        userList: [],
        agentList: [],
        strategyOptions :[],
        strategyMenu: false,
        panStart: { x: 0, y: 0 },
        pinchStartZoom: 1
      };
    },
    watch: {
      'jsonData.strategies': {
        handler(newVal) {
          if(newVal) {
            this.strategyOptions = newVal.map(strategy => ({
                id: strategy.id,
                name: strategy.name,
                perspective: strategy.perspective
              }));
          }
        },
        deep: true
      }
    },
    mounted() {
      console.log("VueEvents", window.$touchEvents);
      this.generator = new ChatGenerator(this, {
          isStream: true,
          preferredLanguage: "Korean"
      });
      this.perspectives = [
        { id: 'financial', label: this.$t('BSCard.finance'), color: '#FA896B' },
        { id: 'customer', label: this.$t('BSCard.customer'), color: '#0074BA' },
        { id: 'internal_process', label: this.$t('BSCard.process'), color: '#01C0C8' },
        { id: 'learning_growth', label: this.$t('BSCard.learning'), color: '#763EBD' }
      ];
      this.init();
      this.initData();
    },
    methods: {
      init() {
        this.initDiagram();
        
        this.$nextTick(() => {
          const elementFactory = this.diagram.get('elementFactory');
          const root = elementFactory.createRoot({ id: 'root' });
          const eventBus = this.diagram.get('eventBus');
          const canvas = this.diagram.get('canvas');
          
          const lanes = this.perspectives.map(p => ({ name: p.label + this.$t('BSCard.aspect'), perspective: p.id }));

          lanes.forEach((lane, index) => {
            this.addStrategyLane(lane.name, lane.perspective, index, lanes.length);
          });
        });
      },
      // Perspective helpers
      getPerspectiveMetaById(id) {
        const key = typeof id === 'string' ? this.toPerspectiveKey(id) : id;
        return this.perspectives.find(p => p.id === key);
      },
      getPerspectiveLabelById(id) {
        const meta = this.getPerspectiveMetaById(id);
        return meta ? meta.label : id;
      },
      toPerspectiveKey(labelOrKey) {
        if (!labelOrKey) return labelOrKey;
        const value = String(labelOrKey).trim();
        // Only convert when Hangul exists
        const hasHangul = /[\u3131-\uD79D]/.test(value);
        if (!hasHangul) return value;
        const compact = value.replace(/\s+/g, '');
        if (compact.includes('재무')) return 'financial';
        if (compact.includes('고객')) return 'customer';
        if (compact.includes('내부') || compact.includes('프로세스')) return 'internal_process';
        if (compact.includes('학습') || compact.includes('성장')) return 'learning_growth';
        return value;
      },
      normalizeJsonData(data) {
        if (!data || !Array.isArray(data.strategies)) return data;
        return {
          ...data,
          strategies: data.strategies.map(s => ({
            ...s,
            perspective: this.toPerspectiveKey(s.perspective)
          }))
        };
      },
      async initData() {
        const card = await backend.getBSCard();
        if (card) {
          this.jsonData = this.normalizeJsonData(card.value);
          this.initializeFromData(this.jsonData);
        }
      },
      initDiagram() {
        if (this.diagram)  {
          const canvas = this.diagram.get('canvas');

          this.diagram.destroy();
        }
        const container = this.$refs.container;
        this.diagram = new BpmnModeler({
          container: container,
          modules: [
            modelingModule,
            connectModule,
            {
              __init__: ['customRenderer'],
              customRenderer: ['type', CustomRenderer]
            },
            // CustomMoveRules,
            // ZoomScroll,
          ]
        });
      },
      initializeFromData(jsonData) {
        try {
          this.resetCanvas();
          if (!jsonData || !jsonData.strategies) return;

          // 먼저 모든 전략 카드를 생성
          jsonData.strategies.forEach((strategy, index) => {
            this.addStrategy(strategy.name, strategy.perspective, strategy.id);
          });

          // 그 다음에 연결선을 생성 (모든 카드가 생성된 후)
          setTimeout(() => {
            jsonData.strategies.forEach((strategy) => {
              if(strategy.parents && strategy.parents.length > 0) {
                strategy.parents.forEach(parent => {
                  this.addConnection(parent, strategy.id);
                });
              }
            });
          }, 100); // 카드 생성 후 약간의 지연

        } catch (error) {
          console.error('데이터 초기화 오류:', error);
        }
      },
      addStrategy(name, perspectiveKey, id = null) {
        const elementFactory = this.diagram.get('elementFactory');
        const canvas = this.diagram.get('canvas');
        const scale = this.isMobile ? 0.5 : 1;

        // 컨테이너 높이를 더 안전하게 계산
        const containerHeight = canvas._container?.clientHeight || this.$refs.container?.clientHeight || 600;
        const totalHeight = containerHeight - 134;
        const laneCount = 4;
        const laneHeight = Math.max(totalHeight / laneCount, 100); // 최소 높이 보장

        const key = this.toPerspectiveKey(perspectiveKey);
        const perspectiveIndex = this.perspectives.findIndex(p => p.id === key);
        
        // perspectiveIndex가 -1인 경우 처리
        if (perspectiveIndex === -1) {
          return;
        }

        const strategiesInLane = this.jsonData.strategies.filter(s => s.perspective === key);

        const indexInLane = strategiesInLane.findIndex(s => s.id === id || s.name === name);
        const safeIndex = indexInLane >= 0 ? indexInLane : strategiesInLane.length;
        const padding = this.isMobile ? 20 : 100;
        const x = padding + safeIndex * 180 * scale;
        const y = perspectiveIndex * laneHeight + laneHeight / 2.5;

        const shape = elementFactory.createShape({
          id: id || 'strategy_' + this.elementId++,
          width: this.defaultStrategyWidth * this.strategyScale * scale,
          height: this.defaultStrategyHeight * this.strategyScale,
          x,
          y,
          name,
          perspective: key,
          type: 'custom:strategy',
          di: {
            bounds: {
              x,
              y,
              width: this.defaultStrategyWidth * this.strategyScale,
              height: this.defaultStrategyHeight * this.strategyScale
            }
          }
        });

        canvas.addShape(shape);
      },
      resetCanvas() {
        if(!this.diagram) return;
        const canvas = this.diagram.get('canvas');
        const rootElement = canvas.getRootElement();

        if (rootElement) {
          const modeling = this.diagram.get('modeling');
          const elementRegistry = this.diagram.get('elementRegistry');

          const allElements = elementRegistry.getAll().filter(e => e !== rootElement && e.type !== 'custom:strategyLane');
          modeling.removeElements(allElements);
        }
      },
      addStrategyLane(name, perspective, index, totalLanes) {
        const elementFactory = this.diagram.get('elementFactory');
        const canvas = this.diagram.get('canvas');
        const elementRegistry = this.diagram.get('elementRegistry');

        const existing = elementRegistry.get(`lane_${perspective}`);
        if (existing) {
          console.warn(`Lane for ${perspective} already exists.`);
          return; // 중복 방지
        }

        const container = this.$refs.container;
        const totalHeight = container?.clientHeight - 134 || 600;

        const spacing = 20;
        const laneHeight = (totalHeight - spacing * (totalLanes - 1)) / totalLanes;
        const y = index * (laneHeight + spacing);

        const shape = elementFactory.createShape({
          id: `lane_${perspective}`,
          x: 0,
          y,
          width: 100,
          height: 40,
          name,
          perspective: perspective,
          type: 'custom:strategyLane',
          di: {
            bounds: { x: 0, y, width: 120, height: laneHeight }
          }
        });

        if(!this.isMobile) {
          canvas.addShape(shape);
        }
      },
      addConnection(sourceId, targetId) {
        const elementRegistry = this.diagram.get('elementRegistry');
        const modeling = this.diagram.get('modeling');

        const source = elementRegistry.get(sourceId);
        const target = elementRegistry.get(targetId);

        if (!source || !target) {
          return;
        }

        const srcCenter = {
          x: source.x + source.width / 2,
          y: source.y + source.height / 2
        };
        const tgtCenter = {
          x: target.x + target.width / 2,
          y: target.y + target.height / 2
        };

        const dx = tgtCenter.x - srcCenter.x;
        const dy = tgtCenter.y - srcCenter.y;

        let sourcePoint, targetPoint;

        // if (Math.abs(dx) > Math.abs(dy)) {
        //   // 좌우 연결
        //   if (dx > 0) {
        //     // 오른쪽
        //     sourcePoint = {
        //       x: source.x + source.width,
        //       y: srcCenter.y
        //     };
        //     targetPoint = {
        //       x: target.x,
        //       y: tgtCenter.y
        //     };
        //   } else {
        //     // 왼쪽
        //     sourcePoint = {
        //       x: source.x,
        //       y: srcCenter.y
        //     };
        //     targetPoint = {
        //       x: target.x + target.width,
        //       y: tgtCenter.y
        //     };
        //   }
        // } else {
          // 상하 연결
          if (dy > 0) {
            // 아래
            sourcePoint = {
              x: srcCenter.x,
              y: source.y + source.height
            };
            targetPoint = {
              x: tgtCenter.x,
              y: target.y
            };
          } else {
            // 위
            sourcePoint = {
              x: srcCenter.x,
              y: source.y
            };
            targetPoint = {
              x: tgtCenter.x,
              y: target.y + target.height
            };
          }
        // }

        modeling.connect(source, target, {
          type: 'custom:connection',
          waypoints: [sourcePoint, targetPoint]
        });
      },
      onZoomIn() {
        this.strategyScale = Math.min(this.strategyScale + 0.1, this.maxStrategyScale);
        const zoomScroll = this.diagram.get('zoomScroll');
        zoomScroll.stepZoom(1);
      },
      onZoomOut() {
        this.strategyScale = Math.max(this.strategyScale - 0.1, this.minStrategyScale);
        const zoomScroll = this.diagram.get('zoomScroll');
        zoomScroll.stepZoom(-1);
      },
      onResetView() {
        this.strategyScale = 1;
        const zoomScroll = this.diagram.get('zoomScroll');
        zoomScroll.reset();
      },
      async confirmDeleteStrategy() {
        this.jsonData.strategies = this.jsonData.strategies.filter(s => s.id !== this.selectedStrategy.id);
        this.initializeFromData(this.jsonData);
        await backend.putBSCard(this.jsonData);
        this.deleteDialog = false;
        this.selectedStrategy = null;
      },
      async saveStrategy() {
        const { name, perspective, description, parents } = this.strategyForm;
        if (!name || !perspective) return;

        // ID 생성
        const newId = 's_' + Date.now();

        // 🔍 현재 관점 내에서 사용된 index 목록
        const usedIndexes = this.jsonData.strategies
          .filter(s => s.perspective === perspective)
          .map(s => s.index ?? 0);

        // ✅ 겹치지 않는 최소 인덱스 찾기 (0부터 순차적으로)
        let newIndex = 0;
        while (usedIndexes.includes(newIndex)) {
          newIndex++;
        }

        // 1. jsonData에 push
        this.jsonData.strategies.push({
          id: newId,
          name,
          perspective: this.toPerspectiveKey(perspective),
          description,
          parents: parents
        });

        this.initializeFromData(this.jsonData);

        await backend.putBSCard(this.jsonData);
        this.addDialog = false;
        this.strategyForm = { name: '', perspective: '', description: '', parents: [] };
      },
      async saveEditedStrategy() {
        const { name, description, parents } = this.editForm;
        const { id } = this.selectedStrategy;
        const strategy = this.jsonData.strategies.find(s => s.id === id);
        if (!strategy) return;

        // 업데이트
        strategy.name = name;
        strategy.description = description;
        strategy.parents = parents;

        this.initializeFromData(this.jsonData);

        await backend.putBSCard(this.jsonData);

        this.editDialog = false;
        this.editForm = { id: null, name: '', description: '', parents: [] };
        this.selectedStrategy = null;
      },
      confirmAddConnection() {
        this.addConnection(this.selectedConnectionSource.id, this.selectedConnectionTarget.id);
        this.connectionDialog = false;
        this.selectedConnectionSource = null;
        this.selectedConnectionTarget = null;
      },
      uuid() {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }

            return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
      },
      async loadData(path) {
          this.chatRoomId = 'bscard_chat';
          await this.getMessages(this.chatRoomId);

          this.userList = await this.backend.getUserList();
          this.agentList = await this.backend.getAgentList();
      },
      beforeSendMessage(newMessage) {
          this.generator.initPreviousMessages();
          this.sendMessage(newMessage);
          const msgObj = this.createMessageObj(newMessage);
          const putObj =  {
              id: 'bscard_chat',
              uuid: this.uuid(),
              messages: msgObj,
          };
          this.putObject("chats", putObj);
      },
      afterModelCreated(response) {
          let messageWriting = this.messages[this.messages.length - 1];

          // if (messageWriting.jsonContent) {
          //     let unknown
          //     try {
          //         unknown = partialParse(messageWriting.jsonContent);
          //     } catch(e) {
          //         console.log(e)
          //         unknown = JSON.parse(messageWriting.jsonContent)
          //     }

          //     if (unknown && !unknown.modifications) {
          //     }
          // }
      },
      async afterGenerationFinished(response) {try {
                let messageWriting = this.messages[this.messages.length - 1];
                if (messageWriting.jsonContent) {
                    let unknown;
                    try {
                        unknown = JSON.parse(messageWriting.jsonContent)
                    } catch(e) {
                        try {
                            unknown = partialParse(messageWriting.jsonContent);
                        } catch(e) {
                            console.log(e)
                            return;
                        }
                    }

                    /*if (unknown && unknown.modifications) {
                        unknown.modifications.forEach(modification => {
                            if (modification.action == "replace") {
                                this.jsonPathReplace(this, modification.targetJsonPath, modification.value)
                            } else if (modification.action == "add") {
                                this.jsonPathAdd(this, modification.targetJsonPath, modification.value)
                            } else if (modification.action == "delete") {
                                this.jsonPathDelete(this, modification.targetJsonPath)
                            }
                        });
                    }*/
                    
                    const normalized = this.normalizeJsonData(unknown);
                    this.jsonData = normalized;
                    this.initializeFromData(normalized);

                    await backend.putBSCard(normalized);
                    
                }

                const newMessage = this.messages[this.messages.length - 1];
                var putObj =  {
                    id: 'bscard_chat',
                    uuid: this.uuid(),
                    messages: newMessage,
                };
                this.putObject("chats", putObj);
            } catch(e) {
                console.log(e);
            }
      },
      afterModelStopped(response) {
          const newMessage = this.messages[this.messages.length - 1];
          const putObj =  {
              id: 'bscard_chat',
              uuid: this.uuid(),
              messages: newMessage,
          };
          this.putObject("chats", putObj);
      },
      getUpperStrategies(id, perspectiveKey) {
        if (this.jsonData.strategies.length === 0) return [];
        const currentPerspective = perspectiveKey
          ? perspectiveKey
          : (this.jsonData.strategies.find(s => s.id === id)?.perspective);
        if (!currentPerspective) return [];
        const idx = this.perspectives.findIndex(p => p.id === currentPerspective);
        if (idx <= 0) return [];
        const upperKey = this.perspectives[idx - 1].id;
        return this.jsonData.strategies.filter(s => s.perspective === upperKey);
      },
      upperStrategyOptions(strategy, perspective) {
        if(!strategy && !perspective) return [];
        const upperStrategies = this.getUpperStrategies(strategy?.id, perspective);
        return upperStrategies.map(s => ({
          id: s.id,
          name: s.name,
          perspective: s.perspective
        }));
      },
      getItemProps(item) {
        const id = item?.perspective ? item.perspective : (item?.id || item);
        const meta = this.getPerspectiveMetaById(id);
        return {
          style: {
            color: meta?.color || 'black',
            fontWeight: 'bold'
          }
        };
      },
      getPerspectiveProps(item) {
        const id = typeof item === 'string' ? this.toPerspectiveKey(item) : (item?.id || item?.perspective || item);
        const meta = this.getPerspectiveMetaById(id);
        return {
          style: {
            color: meta?.color || 'black',
            fontWeight: 'bold'
          }
        };
      },
      onPan(ev) {
        const canvas = this.diagram.get('canvas');
        
        if (ev.type === 'panstart') {
          const viewbox = canvas.viewbox();
          this.panStart = { x: viewbox.x, y: viewbox.y };
        }

        if (ev.type === 'panmove') {
          const viewbox = canvas.viewbox();
          const scale = viewbox.scale || 1;

          canvas.viewbox({
            x: this.panStart.x - ev.deltaX / scale,
            y: this.panStart.y - ev.deltaY / scale,
            width: viewbox.width,
            height: viewbox.height
          });
        }

        if (ev.type === 'panend') {
        }
        ev.srcEvent.stopPropagation();
        ev.srcEvent.preventDefault();
      },
      onPinch(ev) {
        const canvas = this.diagram.get('canvas');

        if (ev.type === 'pinchstart') {
          this.pinchStartZoom = canvas.zoom();
        }

        if (ev.type === 'pinchmove') {
          const newZoom = this.pinchStartZoom * ev.scale;
          canvas.zoom(newZoom);
        }

        if (ev.type === 'pinchend') {
        }
        ev.srcEvent.stopPropagation();
        ev.srcEvent.preventDefault();
      }
    }
  };
  </script>
  
<style>
.bjs-powered-by {
  display: none !important;
}

.legend-color {
  width: 16px;
  height: 16px;
  margin-right: 4px;
  border-radius: 4px;
}

</style>
