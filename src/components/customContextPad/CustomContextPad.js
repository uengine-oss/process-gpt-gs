import { assign } from 'min-dash';
import { i18n } from '@/main';
import { indexOf } from 'lodash';

export default function ContextPadProvider(config, injector, eventBus, contextPad,
  modeling, elementFactory, connect, create, popupMenu, canvas, rules, translate, autoPlace) {

  const originalContextPadProvider = injector.get('contextPadProvider');
  this._config = config;
  this._injector = injector;
  this._eventBus = eventBus;
  this._contextPad = contextPad;
  this._modeling = modeling;
  this._elementFactory = elementFactory;
  this._connect = connect;
  this._create = create;
  this._popupMenu = popupMenu;
  this._canvas = canvas;
  this._rules = rules;
  this._translate = translate;
  this._autoPlace = autoPlace;

  contextPad.registerProvider(this);

  this._originalGetContextPadEntries = originalContextPadProvider.getContextPadEntries.bind(originalContextPadProvider);
}

ContextPadProvider.$inject = [
  'config',
  'injector',
  'eventBus',
  'contextPad',
  'modeling',
  'elementFactory',
  'connect',
  'create',
  'popupMenu',
  'canvas',
  'rules',
  'translate',
  'autoPlace'
];

ContextPadProvider.prototype.getContextPadEntries = function (element) {
  const {
    _modeling: modeling,
    _translate: translate,
    _connect: connect,
    _elementFactory: elementFactory,
    _create: create,
    _injector: injector
  } = this;
  function removeElement(e) {
    modeling.removeElements([element]);
  }

  function startConnect(event, element) {
    connect.start(event, element);
  }

  function appendAction(type, className, title, options) {
    const autoPlace = injector.get('autoPlace', false);
    function appendStart(event, element) {
      const shape = elementFactory.createShape(assign({ type }, options));
      create.start(event, shape, { source: element });
    }
  
    const append = autoPlace
      ? function (_, element) {
          const shape = elementFactory.createShape(assign({ type }, options));
          autoPlace.append(element, shape);
        }
      : appendStart;
  
    const previewAppend = autoPlace
      ? function (_, element) {
          try {
            appendPreview.create(element, type, options);
          } catch (e) {
            console.warn('[appendPreview] 실패:', e);
          }
  
          return () => {
            appendPreview.cleanUp();
          };
        }
      : null;
  
    return {
      group: 'model',
      className,
      title,
      action: {
        dragstart: appendStart,
        click: append,
        hover: previewAppend
      }
    };
  }
  

  const popupMenu = this._popupMenu;

  function getReplaceMenuPosition(element) {
    const Y_OFFSET = 5;

    const diagramContainer = this._canvas.getContainer();
    const pad = this._contextPad.getPad(element).html;

    const diagramRect = diagramContainer.getBoundingClientRect();
    const padRect = pad.getBoundingClientRect();

    const top = padRect.top - diagramRect.top;
    const left = padRect.left - diagramRect.left;

    return {
      x: left,
      y: top + padRect.height + Y_OFFSET
    };
  }

  function adjustParticipantSize(element, newLane) {
    const participant = element.type === 'bpmn:Participant' ? element : element.parent;
    if (participant && participant.type === 'bpmn:Participant') {
      const participantBounds = participant.getBounds ? participant.getBounds() : participant.di.bounds;
      const newLaneBounds = newLane.getBounds ? newLane.getBounds() : newLane.di.bounds;
      modeling.resizeShape(participant, {
        x: participantBounds.x,
        y: participantBounds.y,
        width: participantBounds.width,
        height: participantBounds.height + newLaneBounds.height
      });
    }
  }



  function insertLanes(num) {
    modeling.splitLane(element, num);
  }

  function divideIntoTwoLanes(event) {
    modeling.splitLane(element, 2);
  }

  function divideIntoThreeLanes(event) {
    modeling.splitLane(element, 3);
  }

  function getDi(element) {
    if (!element) return null;
    return element.di || (element.businessObject && element.businessObject.$parent && element.businessObject.$parent.di);
  }

  function splitPhaseContainer(phaseContainer, numPhases) {
    const laneSet = phaseContainer.businessObject.laneSets[0];
    if (!laneSet) {
      console.error("🚨 LaneSet을 찾을 수 없습니다.");
      return;
    }

    for (let i = 0; i < numPhases; i++) {
      // ✅ Phase 생성 (Lane 대신 Phase 사용)
      const phase = elementFactory._moddle.create('phase:Phase', {
        id: `Phase_${Math.random().toString(36).substr(2, 9)}`,
        name: `Phase ${i + 1}`
      });

      laneSet.lanes.push(phase);
    }

    // ✅ LaneSet 업데이트
    modeling.updateProperties(phaseContainer, {
      laneSets: [laneSet]
    });

    console.log(`✅ ${numPhases}개의 Phase 추가 완료.`);
  }


  function addPhaseContainer(participantElement) {


    const processBo = elementFactory._moddle.create('bpmn:Process', {
      id: `Process_${Math.random().toString(36).substr(2, 9)}`,
      isExecutable: false,
      laneSets: []
    })

    // ✅ Participant의 부모 요소 가져오기
    const parentElement = participantElement.parent;
    if (!parentElement) {
      console.error("🚨 Participant의 부모 요소를 찾을 수 없습니다.", participantElement);
      return;
    }

    // ✅ DI 정보 가져오기
    const participantDi = getDi(participantElement);
    if (!participantDi) {
      console.error("🚨 Participant의 DI 정보가 없습니다.", participantElement);
      return;
    }

    // ✅ BusinessObject 생성
    const phaseContainerBO = elementFactory._moddle.create('phase:PhaseContainer', {
      id: `PhaseContainer_${Math.random().toString(36).substr(2, 9)}`,
      numPhases: 0,
      processRef: processBo,
      isHorizontal: false
    });

    // ✅ LaneSet 추가 (splitLane()을 위해 필요)
    const laneSet = elementFactory._moddle.create('bpmn:LaneSet', {
      id: `LaneSet_${Math.random().toString(36).substr(2, 9)}`,
      lanes: []
    });
    processBo.laneSets = [laneSet];  // ✅ LaneSet 추가

    // ✅ DI 정보 생성
    const phaseContainerDI = elementFactory._moddle.create('bpmndi:BPMNShape', {
      id: `DI_${phaseContainerBO.id}`,
      bpmnElement: phaseContainerBO,
      isHorizontal: false,
      bounds: {
        x: participantElement.x + participantElement.width / 2,
        y: participantElement.y - 30, // ✅ Participant 위쪽에 배치
        width: participantElement.width,
        height: 90
      }
    });

    phaseContainerDI.isHorizontal = false

    // ✅ 반드시 $parent를 설정
    phaseContainerDI.$parent = participantDi.$parent;

    // ✅ 부모-자식 관계 초기화
    const parentBO = parentElement.businessObject;

    if (!Array.isArray(parentBO.children)) {
      parentBO.children = [];
    }
    parentBO.children.push(phaseContainerBO);

    // ✅ planeElement 배열이 맞는지 확인 후 push
    let planeElement = participantDi.$parent.get('planeElement');
    if (!Array.isArray(planeElement)) {
      planeElement = [planeElement];
      participantDi.$parent.set('planeElement', planeElement);
    }
    planeElement.push(phaseContainerDI);

    // ✅ PhaseContainer 생성
    const phaseContainer = elementFactory.createShape({
      type: 'phase:PhaseContainer',
      businessObject: phaseContainerBO,
      width: participantElement.width,
      height: 90,
      isHorizontal: false
    });


    // ✅ PhaseContainer의 위치 설정
    const position = {
      x: participantElement.x + participantElement.width / 2,
      y: participantElement.y - 45
    };

    // ✅ PhaseContainer를 `Participant`의 부모에 추가
    modeling.createShape(phaseContainer, position, parentElement);

    console.log("✅ PhaseContainer 생성 완료:", phaseContainer);
    return phaseContainer;
  }


  const actions = this._originalGetContextPadEntries(element);
  if (element.type === 'bpmn:Participant' || element.type === 'bpmn:Lane' || element.type === 'phase:PhaseContainer') {
    const isHorizontal = element.di.isHorizontal
    assign(actions, {
      'lane-insert-above': {
        group: 'lane',
        className: isHorizontal ? 'bpmn-icon-lane-insert-above' : 'bpmn-icon-lane-insert-above icon-rotate-270',
        title: isHorizontal ? i18n.global.t('customContextPad.laneAbove') : i18n.global.t('customContextPad.laneToTheLeft'),
        action: {
          click: actions['lane-insert-above'].action.click
        }
      },
      'lane-insert-below': {
        group: 'lane',
        className: isHorizontal ? 'bpmn-icon-lane-insert-below' : 'bpmn-icon-lane-insert-below icon-rotate-270',
        title: isHorizontal ? i18n.global.t('customContextPad.laneBelow') : i18n.global.t('customContextPad.laneToTheRight'),
        action: {
          click: actions['lane-insert-below'].action.click
        }
      },
      'lane-divide-two': {
        group: 'lane',
        className: isHorizontal ? 'bpmn-icon-lane-divide-two' : 'bpmn-icon-lane-divide-two icon-rotate-270',
        title: i18n.global.t('customContextPad.laneDivideTwo'),
        action: {
          click: divideIntoTwoLanes
        }
      },
      'lane-divide-three': {
        group: 'lane',
        className: isHorizontal ? 'bpmn-icon-lane-divide-three' : 'bpmn-icon-lane-divide-three icon-rotate-270',
        title: i18n.global.t('customContextPad.laneDivideThree'),
        action: {
          click: divideIntoThreeLanes
        }
      },
      'lane-insert-single': {
        group: 'lane',
        className: isHorizontal ? 'bpmn-icon-participant' : 'bpmn-icon-participant icon-rotate-90',
        title: isHorizontal ? i18n.global.t('customContextPad.lane') : i18n.global.t('customContextPad.laneToTheLeft'),
        action: {
          click: function (event, element) {
            const laneCount = element.children.filter(child => child.type === 'bpmn:Lane').length;
            insertLanes(1);
          }
        }
      },
      'connect': {
        group: 'connect',
        className: 'bpmn-icon-connection-multi',
        title: i18n.global.t('customContextPad.connectionMulti'),
        action: {
          click: startConnect,
          dragstart: startConnect
        }
      }
    });

    if (element.type === 'bpmn:Participant') {
      assign(actions, {
        'append.phase.container': {
          group: 'model',
          className: 'mdi mdi-label-outline',
          title: i18n.global.t('customContextPad.phase'),
          action: {
            click: function (event, element) {
              const phaseContainer = addPhaseContainer(element);

              modeling.splitLane(phaseContainer, 3);
            }
          }
        }
      });
    }

    if (element.type === 'phase:PhaseContainer') {
      assign(actions, {
        'append.phase': {
          group: 'model',
          className: 'bpmn-icon-phase',
          title: i18n.global.t('customContextPad.phase'),
          action: {
            click: function (event, element) {
              splitPhaseContainer(element, 3); // 기본 2개로 나누기
            }
          }
        }
      });
    }
  }

  if (actions['append.end-event']) {
    actions['append.end-event'].title = i18n.global.t('customContextPad.endEvent');
  }
  if (actions['append.gateway']) {
    actions['append.gateway'].title = i18n.global.t('customContextPad.gateway');
  }
  if (actions['append.append-task']) {
    const newAction = appendAction(
      'bpmn:UserTask',
      actions['append.append-task'].className,
      i18n.global.t('customContextPad.task'),
      {}
    );
  
    actions['append.append-task'].action = newAction.action;
  }
  if (actions['append.intermediate-event']) {
    actions['append.intermediate-event'].title = i18n.global.t('customContextPad.intermediateEvent');
  }
  if (actions['append.text-annotation']) {
    actions['append.text-annotation'].title = i18n.global.t('customContextPad.textAnnotation');
  }
  if (actions['replace']) {
    actions['replace'] = {
      group: 'edit',
      className: 'bpmn-icon-screw-wrench',
      title: i18n.global.t('customContextPad.replace'),
      action: {
        click: function (event, element) {
          var position = assign({
            x: event.x,
            y: event.y
          },
            {
              cursor: { x: event.x, y: event.y }
            });

          popupMenu.open(element, 'bpmn-replace', position, {
            title: i18n.global.t('customContextPad.replace'),
            width: 300,
            search: true
          });
        }
      }
    }
  }
  if (actions['connect']) {
    actions['connect'].title = i18n.global.t('customContextPad.connect');
  }
  if (actions['delete']) {
    actions['delete'].title = i18n.global.t('customContextPad.delete');
  }

  return actions;
};