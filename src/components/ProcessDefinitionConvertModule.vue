
<script>
import { parseString } from 'xml2js';
export default {
    data: () => ({
      currentSource:'start_event',
      currentRole: 'Initiator',
      loopSource: null,
      loopChilds: {},
      sequenceConditions:{}
    }),
    methods: {
      convertCSVToJSON(content) {
        const typeMap = {
          "조건": "Gateway",
          "일반": "Activity",
          "호출": "CallActivity"
        };

        const elementTypeMap = {
          "Gateway": { elementType: "Gateway", type: "ExclusiveGateway" },
          "Activity": { elementType: "Activity", type: "UserActivity" },
          "CallActivity": { elementType: "CallActivity", type: "CallActivity" }
        };

        const clean = s => (s || "").replace(/^"+|"+$/g, '').trim();

        const rows = this.parseCsvToJson(content); // 🔥 CSV는 이 함수에서만 파싱함

        const elements = [];
        const rolesSet = new Set();
        const nameToIdMap = {};
        const idToNameMap = {};
        let idCounter = 1;
        let sequenceCounter = 1;
        const sequenceSet = new Set();

        // 1. 엘리먼트 생성
        rows.forEach(row => {
          const name = clean(row.name);
          const role = clean(row.role);
          const rawType = clean(row.type);
          const mappedType = typeMap[rawType] || "Activity";
          const typeInfo = elementTypeMap[mappedType];

          const id = `el_${idCounter++}`;
          nameToIdMap[name] = id;
          idToNameMap[id] = name;
          rolesSet.add(role);

          const base = {
            elementType: typeInfo.elementType,
            id,
            name,
            role,
            source: null,
            type: typeInfo.type,
            description: ""
          };

          if (typeInfo.elementType === "Activity") {
            base.instruction = "";
            base.inputData = [];
            base.outputData = [];
            base.checkpoints = [];
            base.duration = "5";
          }

          elements.push(base);
        });

        // 2. 후행 기준 시퀀스 연결
        rows.forEach(row => {
          const sourceName = clean(row.name);
          const sourceId = nameToIdMap[sourceName];
          const nexts = clean(row.nextProcess || "")
            .split(",")
            .map(clean)
            .filter(Boolean);

          nexts.forEach(targetName => {
            const targetId = nameToIdMap[targetName];
            const seqKey = `${sourceId}->${targetId}`;
            if (sourceId && targetId && !sequenceSet.has(seqKey)) {
              elements.push({
                elementType: "Sequence",
                id: `seq_${sequenceCounter++}`,
                name: `${sourceName} → ${targetName}`,
                source: sourceId,
                target: targetId
              });
              sequenceSet.add(seqKey);
            }
          });
        });

        // 3. StartEvent / EndEvent 후처리
        const taskElements = elements.filter(el => (el.elementType === "Activity" || el.elementType === "CallActivity" || el.elementType === "Gateway"));

        taskElements.forEach(task => {
          const id = task.id;

          const hasIncoming = elements.some(
            el => el.elementType === "Sequence" && el.target === id
          );
          const hasOutgoing = elements.some(
            el => el.elementType === "Sequence" && el.source === id
          );

          if (!hasIncoming) {
            const startId = `start_${id}`;
            elements.push({
              elementType: "Event",
              id: startId,
              name: "Start",
              role: task.role,
              source: null,
              type: "StartEvent",
              description: "",
              trigger: ""
            });
            elements.push({
              elementType: "Sequence",
              id: `seq_${sequenceCounter++}`,
              name: `Start → ${task.name}`,
              source: startId,
              target: id
            });
          }

          if (!hasOutgoing) {
            const endId = `end_${id}`;
            elements.push({
              elementType: "Event",
              id: endId,
              name: "End",
              role: task.role,
              source: id,
              type: "EndEvent",
              description: "",
              trigger: ""
            });
            elements.push({
              elementType: "Sequence",
              id: `seq_${sequenceCounter++}`,
              name: `${task.name} → End`,
              source: id,
              target: endId
            });
          }
        });

        return {
          megaProcessId: "test1",
          majorProcessId: "test1",
          processDefinitionName: "테스트 프로세스",
          processDefinitionId: "test_process",
          description: "CSV 기반 프로세스 자동 생성",
          isHorizontal: true,
          data: [],
          roles: [...rolesSet].map(role => ({
            name: role,
            resolutionRule: ""
          })),
          elements
        };
      },
      parseCsvToJson(csvString) {
        const fieldMap = {
          "이름": "name",
          "역할": "role",
          "선행 프로세스": "prevProcess",
          "후행": "nextProcess",
          "유형": "type",
          "호출 프로세스": "calledProcess"
        };

        const clean = s => (s || "").replace(/^"+|"+$/g, '').trim();

        const lines = csvString.trim().split("\n");
        const headersRaw = lines[0].split(",").map(clean);
        const headers = headersRaw.map(h => {
          const base = h.replace(/\(.*\)/g, "").trim(); // 괄호 제거
          return fieldMap[base] || base;
        });

        const rows = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          const cells = [];
          let current = '';
          let inQuotes = false;

          for (let j = 0; j < line.length; j++) {
            const char = line[j];

            if (char === '"' && line[j + 1] === '"') {
              current += '"';
              j++;
            } else if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              cells.push(clean(current));
              current = '';
            } else {
              current += char;
            }
          }
          cells.push(clean(current));

          const row = {};
          headers.forEach((key, idx) => {
            row[key] = cells[idx] || "";
          });
          rows.push(row);
        }

        return rows;
      },
      convertOldJson(content) {
          let me = this;
          me.currentSource = 'start_event';
          me.loopSource = null;
          me.loopChilds = {};
          me.sequenceConditions = {};
          let result = 
          {
            "megaProcessId": "test1",
            "majorProcessId": "test1",
            "processDefinitionName": "test",
            "processDefinitionId": "test",
            "description": "test",
          }

          const json = content;
          result.megaProcessId = json.name.text;
          result.majorProcessId = json.name.text;
          result.processDefinitionName = json.name.text;
          result.processDefinitionId = json.serviceDefinitions[0].name;
          result.description = json.description.text;
          result.data = [];
          result.roles = [];
          result.sequences = [];
          result.elements = [];


          me.parseData(json.processVariables[1], result);
          json.roles[1].forEach(role => {
            result.roles.push({
              "name": role.name,
              "endpoint": role.endpoint || '',
              "resolutionRule": role.name
            });
          });
          result.elements.push(
          {
            "elementType": "Event",
            "id": me.currentSource,
            "name": "Start Event",
            "role": "Initiator",
            "source": null,
            "type": "StartEvent",
            "description": "프로세스 시작"
          });

          me.parseElements(json.childActivities[1], result);
          const lastElement = result.elements[result.elements.length - 1];
          result.elements.push(
          {
            "elementType": "Event",
            "id": "end_event",
            "name": "End Event",
            "role": "Initiator",
            "source": lastElement.id,
            "type": "EndEvent",
            "description": "프로세스 종료"
          });

          
          result.sequences.push({
            "id" : me.currentSource + '_' + 'end_event',
            "source": me.currentSource,
            "target": "end_event"
          })

          return result;
        },
        parseData(variables, definition) {
          variables.forEach(variable => {
            let type = "Text";
            if(variable.type.indexOf("Number") != -1) {
                type = "Number";
            }

            definition.data.push({
              "name": variable.name,
              "description": variable.name,
              "type": type
            });
          });
        },
        getId(element) {
          const activityType = element._type;
          let id = ''
          if(activityType.indexOf("HumanActivity") != -1) {
            id = 'activity_' + element.tracingTag;
          } else if("SwitchActivity") {
            id = 'gateway_' + element.tracingTag;
          }

          return id;
        },
        parseElements(activities, definition, loopId = null) {
          const me = this;
          let id = '';

          activities.forEach((activity, key) => {
            const activityType = activity._type;
            let loopAct = [];
            if(activityType.indexOf("HumanActivity") != -1) {
              
              const name = activity.name.text;
              const roleName = activity.role? activity.role.name: '';
              const description = activity.description.text ? activity.description.text:'';
              id = me.getId(activity);
              const instruction = activity.instruction;
              if(activity.previousActivities) {
                me.currentSource = me.getId(activity.previousActivities[1][0]);
              }

              if(activity.parentId) {
                me.currentSource = activity.parentId;
              }

              if(me.loopSource) {
                me.currentSource = '' + me.loopSource;
                me.loopSource = null;
              }

              if(loopId) {
                if(!me.loopChilds[loopId]) {
                  me.loopChilds[loopId] = [];
                }
                 
                me.loopChilds[loopId].push(activity);
              }

              definition.sequences.push({
                "id" : me.currentSource + '_' + id,
                "source": me.currentSource,
                "target": id
              });

              definition.elements.push(
              {
                  "elementType" :"Activity",
                  "id": id,
                  "name": name,
                  "type": "UserActivity",
                  "source": me.currentSource, 
                  "description": description,
                  "instruction": instruction,
                  "role": roleName, 
                  "inputData": [],
                  "outputData": [],
                  "checkpoints":[],
              });

              me.currentSource = id;

    
            } else if(activityType.indexOf("LoopActivity") != -1) {
              loopAct.push(activity);
            } else if(activityType.indexOf("SwitchActivity") != -1) {
              const name = activity.name.text;
              const role = activity.previousActivities[1][0].role;
              const roleName = role.name;
              id = me.getId(activity);
              const description = activity.description.text ? activity.description.text:'';

              
              if(activity.previousActivities) {
                me.currentSource = me.getId(activity.previousActivities[1][0]);
              }

              if(activity.parentId) {
                me.currentSource = activity.parentId;
              }

              definition.sequences.push({
                "id" : me.currentSource + '_' + id,
                "source": me.currentSource,
                "target": id
              });

              definition.elements.push(
              {
                "elementType" :"Gateway",
                "id": id,
                "name": name,
                "role": roleName, 
                "source": me.currentSource,
                "type": "ExclusiveGateway",
                "description": description
              });

              
            } else if(activityType.indexOf("AllActivity") != -1) {

              const name = activity.name.text;
              const role = activity.previousActivities[1][0].role;
              const roleName = role.name;
              id = me.getId(activity);
              const description = activity.description.text ? activity.description.text:'';

              if(activity.previousActivities) {
                me.currentSource = me.getId(activity.previousActivities[1][0]);
              }

              if(activity.parentId) {
                me.currentSource = activity.parentId;
              }

              definition.sequences.push({
                "id" : me.currentSource + '_' + id,
                "source": me.currentSource,
                "target": id
              });

              definition.elements.push(
              {
                "elementType" :"Gateway",
                "id": id,
                "name": name,
                "role": roleName, 
                "source": me.currentSource,
                "type": "ParallelGateway",
                "description": description
              });

            }


            if(activity.childActivities) {
              activity.childActivities[1].forEach(activity => {
                activity.parentId = id;
              });
              if(activityType.indexOf("LoopActivity") != -1) {
                loopId = me.getId(activity);
              }
              me.parseElements(activity.childActivities[1], definition, loopId)
            }
            
            
            const reversedLoopActivities = loopAct.slice().reverse();
            reversedLoopActivities.forEach(activity => {
              const name = activity.name.text;
              const role = activity.previousActivities[1][0].role;
              const roleName = role.name;
              id = me.getId(activity);
              const description = activity.description.text ? activity.description.text:'';
              let source = me.currentSource;

              if(activity.childActivities) {
                activity.childActivities[1].forEach(child=> {
                  let loopSequence = {
                    "id" : id + '_' + me.getId(child),
                    "source": id,
                    "target": me.getId(child)
                  };
                  if(activity.loopingCondition) {
                    if(activity.loopingCondition.conditions[1]) {
                      const conditions = activity.loopingCondition.conditions[1];
                      loopSequence.condition = conditions[0].conditions[1][0];
                    }
                  }

                  definition.sequences.push(loopSequence);
                });
              }

              if(me.loopChilds[id]) {
                me.loopChilds[id].forEach(activity=> {
                  definition.sequences.push({
                    "id" : me.getId(activity) + '_' + id,
                    "source": me.getId(activity),
                    "target": id
                  });
                });
              }

              

              definition.elements.push(
              {
                "elementType" :"Gateway",
                "id": id,
                "name": name,
                "role": roleName, 
                "source": source,
                "type": "ExclusiveGateway",
                "description": description
              });

              me.loopSource = id;

            });
          });


        }
    }


    /*component
                {
                  "componentType" :"Gateway",
                  "id": "gateway_id",
                  "name": "gateway name",
                  "role": "role name", 
                  "source": "components id",
                  "type": "ExclusiveGateway",
                  "description": "선택적 또는 병렬 프로세스 흐름을 제어하는 게이트웨이 설명"
                },
                {
                  "componentType" :"Activity",
                  "id": "String-based unique id of the activity not including space",
                  "name": "activity name",
                  "type": "UserActivity",
                  "source": "components id", 
                  "description": "description of activity",
                  "instruction": "instruction to user",
                  "role": "role name", 
                  "inputData": ["name of data for input"],
                   "outputData": [
                     "name of data for output"
                   ],
                   "checkpoints":["checkpoint 1", "checkpoint 2"],
                   "source": "components id"
                 },
                 {
                  "componentType" :"Event",
                  "id": "startEvent",
                  "name": "event name",
                  "role": "role name",
                  "source": "components id", 
                  "type": "StartEvent | EndEvent | IntermediateCatchEvent | MessageEvent | TimerEvent | ErrorEvent | ConditionalEvent | SignalEvent | TerminationEvent | LinkEvent | CompensationEvent | MultipleEvent | ParallelEvent | EscalationEvent | CancelEvent",
                  "description": "프로세스의 시작, 종료 또는 중간 이벤트 설명",
                  "trigger": "이벤트 트리거 조건 (if applicable)"
                }
    */
    /*

    {
        "source": "activity id of source activity or gateway id of source gateway",
        "target": "activity id of target activity or gateway id of target gateway", 
        "condition": 
        {
            "key": "data의 name",
            "condition" : " == | != | > | >= | < | <=",
            "value": ""
        } 
    }
    */
};
</script>
