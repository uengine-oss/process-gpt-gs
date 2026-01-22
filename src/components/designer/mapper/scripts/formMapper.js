

export function add(a, b) {
  var result = {
    x: a.x + b.x,
    y: a.y + b.y,
  };
  if (b.appendX != undefined && b.appendY != undefined) {
    result["appendX"] = a.x + b.appendX;
    result["appendY"] = a.y + b.appendY;
  }
  return result;
}

export function sub(a, b) {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
  };
}

export function copy(src, dest) {
  dest.x = src.x;
  dest.y = src.y;
}

export function d({ x, y }) {
  return `${x},${y}`;
}
export default {
  data() {
    return {
      blockTemplates: {
        Abs: {
          size: { width: 100, height: 50 },
          ports: {
            "in input": { x: -50, y: 10 },
            out: { x: 50, y: 10, direction: "out" },
          },
          parent: "Math",
          class: "org.uengine.processdesigner.mapper.transformers.AbsTransformer",
          isTransform: true,
          appendable: false,
        },
        Ceil: {
          size: { width: 100, height: 50 },
          ports: {
            "in input": { x: -50, y: 10 },
            out: { x: 50, y: 10, direction: "out" },
          },
          parent: "Math",
          class: "org.uengine.processdesigner.mapper.transformers.CeilTransformer",
          isTransform: true,
          appendable: false,
        },
        Concat: {
          size: { width: 120, height: 120 },
          ports: {
            "in str1": { x: -60, y: -30 },
            "in str2": { x: -60, y: -10 },
            "in str3": { x: -60, y: 10 },
            "in str4": { x: -60, y: 30 },
            "in str5": { x: -60, y: 50 },
            out: { x: 60, y: 10, direction: "out" },
          },
          parent: "String",
          class: "org.uengine.processdesigner.mapper.transformers.ConcatTransformer",
          isTransform: true,
          appendable: false,
        },
        Floor: {
          size: { width: 100, height: 50 },
          ports: {
            "in input": { x: -50, y: 10 },
            out: { x: 50, y: 10, direction: "out" },
          },
          parent: "Math",
          class: "org.uengine.processdesigner.mapper.transformers.FloorTransformer",
          isTransform: true,
          appendable: false,
        },
        Max: {
          size: { width: 100, height: 60 },
          ports: {
            "in value1": { x: -50, y: 0 },
            "in value2": { x: -50, y: 20 },
            out: { x: 50, y: 10, direction: "out" },
          },
          parent: "Math",
          class: "org.uengine.processdesigner.mapper.transformers.MaxTransformer",
          isTransform: true,
          appendable: false,
        },
        Min: {
          size: { width: 100, height: 60 },
          ports: {
            "in value1": { x: -50, y: 0 },
            "in value2": { x: -50, y: 20 },
            out: { x: 50, y: 0, direction: "out" },
          },
          parent: "Math",
          class: "org.uengine.processdesigner.mapper.transformers.MinTransformer",
          isTransform: true,
          appendable: false,
        },
        NumberFormat: {
          size: { width: 150, height: 60, appendWidth: 150, appendHeight: 150 },
          ports: {
            "in input": { x: -75, y: 0, appendX: -75, appendY: -40 },
            "in locale": { x: -75, y: 20, appendX: -75, appendY: 60 },
            out: { x: 75, y: 10, direction: "out", appendX: 75, appendY: 10 },
          },
          attributes: {
            "inputType": { x: -55, y: -20, width: 100, height: 50, func: "NumberFormatInput", value: "" },
            "toType": { x: -55, y: 30, width: 100, height: 50, func: "NumberFormatTo", value: "" },
          },
          parent: "String",
          class: "org.uengine.processdesigner.mapper.transformers.NumberFormatTransformer",
          isTransform: true,
          appendable: true,
        },
        Round: {
          size: { width: 100, height: 50 },
          ports: {
            "in input": { x: -50, y: 10 },
            out: { x: 50, y: 10, direction: "out" },
          },
          parent: "Math",
          class: "org.uengine.processdesigner.mapper.transformers.RoundTransformer",
          isTransform: true,
          appendable: false,
        },
        Replace: {
          size: { width: 120, height: 50, appendWidth: 150, appendHeight: 130 },
          ports: {
            "in input": { x: -60, y: 10, appendX: -75, appendY: 10 },
            out: { x: 60, y: 10, direction: "out", appendX: 75, appendY: 10 },
          },
          attributes: {
            "oldString": { x: -55, y: -15, func: "input", value: "" },
            "newString": { x: -55, y: 30, func: "input", value: "" },
            "isRegularExp": { x: -55, y: 45, func: "checkbox", value: "false" },
          },
          parent: "String",
          class: "org.uengine.processdesigner.mapper.transformers.ReplaceTransformer",
          isTransform: true,
          appendable: true,
        },
        Sum: {
          size: { width: 100, height: 120 },
          ports: {
            "in val1": { x: -50, y: -30 },
            "in val2": { x: -50, y: -10 },
            "in val3": { x: -50, y: 10 },
            "in val4": { x: -50, y: 30 },
            "in val5": { x: -50, y: 50 },
            out: { x: 50, y: 10, direction: "out" },
          },
          parent: "Math",
          class: "org.uengine.processdesigner.mapper.transformers.SumTransformer",
          isTransform: true,
          appendable: false,
        },
        NotNullValidator: {
          size: { width: 140, height: 220, appendWidth: 140, appendHeight: 270 },
          ports: {
            "in in1": { x: -70, y: -80, appendX: -70, appendY: -60 },
            "in in2": { x: -70, y: -60, appendX: -70, appendY: -40 },
            "in in3": { x: -70, y: -40, appendX: -70, appendY: -20 },
            "in in4": { x: -70, y: -20, appendX: -70, appendY: 0 },
            "in in5": { x: -70, y: 0, appendX: -70, appendY: 20 },
            "in in6": { x: -70, y: 20, appendX: -70, appendY: 40 },
            "in in7": { x: -70, y: 40, appendX: -70, appendY: 60 },
            "in in8": { x: -70, y: 60, appendX: -70, appendY: 80 },
            "in in9": { x: -70, y: 80, appendX: -70, appendY: 100 },
            "in in10": { x: -70, y: 100, appendX: -70, appendY: 120 },
            out: { x: 70, y: 10, direction: "out" },
          },
          attributes: {
            "validationMessage": { x: -55, y: -90, func: "input", value: "" },
          },
          parent: "Validator",
          class: "org.uengine.processdesigner.mapper.transformers.NotNullValidator",
          isTransform: true,
          appendable: true,
        },
        RegularExpValidator: {
          size: { width: 160, height: 220, appendWidth: 160, appendHeight: 290 },
          ports: {
            "in in1": { x: -80, y: -80, appendX: -80, appendY: -50 },
            "in in2": { x: -80, y: -60, appendX: -80, appendY: -30 },
            "in in3": { x: -80, y: -40, appendX: -80, appendY: -10 },
            "in in4": { x: -80, y: -20, appendX: -80, appendY: 10 },
            "in in5": { x: -80, y: 0, appendX: -80, appendY: 30 },
            "in in6": { x: -80, y: 20, appendX: -80, appendY: 50 },
            "in in7": { x: -80, y: 40, appendX: -80, appendY: 70 },
            "in in8": { x: -80, y: 60, appendX: -80, appendY: 90 },
            "in in9": { x: -80, y: 80, appendX: -80, appendY: 110 },
            "in in10": { x: -80, y: 100, appendX: -80, appendY: 130 },
            out: { x: 80, y: 10, direction: "out" },
          },
          attributes: {
            "validationMessage": { x: -55, y: -110, func: "input", value: "" },
            "regularExpression": { x: -55, y: -80, func: "input", value: "" },
          },
          parent: "Validator",
          class: "org.uengine.processdesigner.mapper.transformers.RegularExpValidator",
          isTransform: true,
          appendable: true,
        },
        SizeValidator: {
          size: { width: 120, height: 220, appendWidth: 150, appendHeight: 290 },
          ports: {
            "in in1": { x: -60, y: -80, appendX: -75, appendY: -50 },
            "in in2": { x: -60, y: -60, appendX: -75, appendY: -30 },
            "in in3": { x: -60, y: -40, appendX: -75, appendY: -10 },
            "in in4": { x: -60, y: -20, appendX: -75, appendY: 10 },
            "in in5": { x: -60, y: 0, appendX: -75, appendY: 30 },
            "in in6": { x: -60, y: 20, appendX: -75, appendY: 50 },
            "in in7": { x: -60, y: 40, appendX: -75, appendY: 70 },
            "in in8": { x: -60, y: 60, appendX: -75, appendY: 90 },
            "in in9": { x: -60, y: 80, appendX: -75, appendY: 110 },
            "in in10": { x: -60, y: 100, appendX: -75, appendY: 130 },
            out: { x: 60, y: 10, direction: "out" },
          },
          attributes: {
            "validationMessage": { x: -55, y: -110, func: "input", value: "" },
            "size": { x: -55, y: -80, func: "input", value: "" },
          },
          parent: "Validator",
          class: "org.uengine.processdesigner.mapper.transformers.SizeValidator",
          isTransform: true,
          appendable: true,
        },
        BeanValue: {
          size: { width: 120, height: 50, appendWidth: 150, appendHeight: 80 },
          ports: {
            "in in": { x: -60, y: 10, appendX: -75, appendY: -10 },
            out: { x: 60, y: 10, direction: "out", appendX: 75, appendY: -10 },
          },
          attributes: {
            "className": { x: -55, y: 15, func: "input", value: "" },
          },
          parent: "Resolver",
          class: "org.uengine.processdesigner.mapper.transformers.BeanValueTransformer",
          isTransform: true,
          appendable: true,
        },
        DirectSQL: {
          size: { width: 120, height: 50, appendWidth: 150, appendHeight: 100 },
          ports: {
            out: { x: 60, y: 10, direction: "out", appendX: 75, appendY: -20 },
          },
          attributes: {
            "value": { x: -55, y: 10, func: "input", value: "" },
            "type": { x: -55, y: 30, width: 100, height: 50, func: "SQLFormatInput", value: "" },

          },
          parent: "ETC",
          class: "org.uengine.processdesigner.mapper.transformers.DirectSqlExpressionTransformer",
          isTransform: true,
          appendable: true,
        },
        DirectValue: {
          size: { width: 120, height: 50, appendWidth: 150, appendHeight: 80 },
          ports: {
            out: { x: 60, y: 10, direction: "out", appendX: 75, appendY: -10 },
          },
          attributes: {
            "value": { x: -55, y: 15, func: "input", value: "" },
          },
          parent: "ETC",
          class: "org.uengine.processdesigner.mapper.transformers.DirectValueTransformer",
          isTransform: true,
          appendable: true,
        },
        ToNumber: {
          size: { width: 120, height: 50, appendWidth: 150, appendHeight: 80 },
          ports: {
            "in input": { x: -60, y: 10, appendX: -75, appendY: -10 },
            out: { x: 60, y: 10, direction: "out", appendX: 75, appendY: -10 },
          },
          attributes: {
            "toType": { x: -55, y: 15, func: "NumberFormatInput", value: "" },
          },
          parent: "Math",
          class: "org.uengine.processdesigner.mapper.transformers.NumberTransformer",
          isTransform: true,
          appendable: true,
        },
        SequenceGenerator: {
          size: { width: 150, height: 50 },
          ports: {
            out: { x: 75, y: 0, direction: "out" },
          },
          parent: "ETC",
          class: "org.uengine.processdesigner.mapper.transformers.SequenceGeneratorTransformer",
          isTransform: true,
          appendable: false,
        },
        XMLParsing: {//직접 값을 입력하는듯 함
          size: { width: 120, height: 50, appendWidth: 150, appendHeight: 80 },
          ports: {
            out: { x: 60, y: 10, direction: "out", appendX: 75, appendY: -10 },
          },
          attributes: {
            "xml": { x: -55, y: 15, func: "input", value: "" },
          },
          parent: "ETC",
          class: "org.uengine.processdesigner.mapper.transformers.XMLParsingTransformer",
          isTransform: true,
          appendable: true,
        },
        Source: {//소스
          size: { width: 0, height: 0 },
          ports: {
            // out: { x: 5, y: 0, direction: "out" },
            // out1: { x: 5, y: 25, direction: "out" },
          },
          isTransform: false,
        },
        Target: {//타겟
          size: { width: 0, height: 0 },
          ports: {
            // in: { x: -5, y: 0, direction: "in" },
            // in1: { x: -5, y: 25, direction: "in" },
          },
          isTransform: false,
        },
      },
      blocks: {
      },
      connections: [
      ],
      tempConnections: [
      ],
      attributes: {
      },
      appendComponent: {},
      pendingConnection: null,
      pendingConnectionEnd: null,
      draggedBlockPos: null,
      dragOffset: null,
    };
  },
  methods: {
    getBlock(name) {
      const block = this.blocks[name];
      if (block) {
        return {
          ...this.blockTemplates[block.type],
          ...block,
          name,
        };
      }
      return null;
    },
    resolvePos(spec) {
      if (_.isObject(spec) && spec.x !== undefined && spec.y !== undefined) {
        return spec;
      }
      const block = this.getBlock(spec[0]);
      if (block != null) {
        var ports = block.ports[spec[1]];
        if (block.appendable == true) {
          if (this.appendComponent != undefined && this.appendComponent[spec[0]] != undefined && this.appendComponent[spec[0]] == true) {
            ports = { x: block.ports[spec[1]].appendX, y: block.ports[spec[1]].appendY };
          }
        }
        var pos = add(block.pos, ports || { x: 0, y: 0 });
        return pos;
      }
      return { x: 0, y: 0 };
    },
    mousePos({ clientX, clientY }) {
      return sub({ x: clientX, y: clientY }, this.offset);
    },
    updateMousePos(event) {
      if (this.pendingConnection) {
        this.pendingConnection[this.pendingConnectionEnd] =
          this.mousePos(event);
      }
      if (this.draggedBlockPos) {
        copy(add(this.mousePos(event), this.dragOffset), this.draggedBlockPos);
      }
    },
    startBlockDrag(blockPos, offset) {
      this.draggedBlockPos = blockPos;
      this.dragOffset = add(this.offset, offset);
    },
    endBlockDrag() {
      this.draggedBlockPos = null;
    },
    newBlockDrag(type) {
      return (blockPos, offset) => {
        const newBlock = {
          type,
          pos: blockPos,
          attributes: {},
        };
        let nextBlockName = type;
        for (let i = 2; this.blocks[nextBlockName]; i++) {
          nextBlockName = `${type} ${i}`;
        }
        Vue.set(this.blocks, nextBlockName, newBlock);
        this.draggedBlockPos = newBlock.pos;
        this.dragOffset = add(this.offset, offset);
      };
    },
    newBlock(type, pos, blockName) {
      const svgElement = this.$refs.svgElement;

      const svgRect = svgElement.getBoundingClientRect();

      pos.x = pos.x - svgRect.left;
      pos.y = pos.y - svgRect.top;
      const newBlock = {
        type: type,
        pos: pos,
        attributes: {},
      };
      let nextBlockName = type;
      if (blockName) {
        nextBlockName = blockName;
        for (let i = 2; this.blocks[nextBlockName]; i++) {
          nextBlockName = `${blockName} ${i}`;
        }
      } else {
        for (let i = 2; this.blocks[nextBlockName]; i++) {
          nextBlockName = `${type} ${i}`;
        }
      }
      this.blocks[nextBlockName] = newBlock;
    },
    deleteBlock(name) {
      if (this.blocks[name]) {
        this.connections = this.connections.filter(connection => {
          return connection.from[0] !== name && connection.to[0] !== name;
        });
        delete this.blocks[name];
      }
    },
    newConnection(block, port, portDirection) {
      return (event) => {
        if (portDirection == "out") {
          this.pendingConnectionEnd = "to";
        } else {
          this.pendingConnectionEnd = "from";
        }
        this.pendingConnection = {
          from: [block, port],
          to: [block, port],
          [this.pendingConnectionEnd]: this.mousePos(event),
          isNew: true,
        };
        this.connections.push(this.pendingConnection);
      };
    },
    cancelConnection() {
      if (this.pendingConnection) {
        this.connections.pop();
        this.pendingConnection = null;
        this.pendingConnectionEnd = null;
      }
    },
    completeConnection(block, port, portDirection) {
      return () => {
        if (this.pendingConnection) {
          if (
            (this.pendingConnectionEnd === "to" && portDirection !== "in") ||
            (this.pendingConnectionEnd === "from" && portDirection !== "out")
          ) {
            this.cancelConnection();
          } else {
            this.pendingConnection[this.pendingConnectionEnd] = [block, port];
            delete this.pendingConnection.isNew;
            const duplicateIndex = _.findIndex(
              this.connections,
              this.pendingConnection
            );
            if (duplicateIndex != this.connections.length - 1) {
              this.removeConnection(duplicateIndex);
              this.connections.pop();
            }
            this.pendingConnection = null;
            this.pendingConnectionEnd = null;
          }
        }
      };
    },
    removeConnection(index) {
      this.connections.splice(index, 1);
    },
    onMouseUp() {
      this.cancelConnection();
      this.endBlockDrag();
    },
    filterTransformItems(blockTemplates) {
      var items = [];
      Object.keys(blockTemplates).forEach(key => {
        if (blockTemplates[key].isTransform) {
          var item = {
            title: key,
            active: false
          };
          var parent = blockTemplates[key].parent;
          if (parent) {
            let parentItem = items.find(item => item.title == parent);
            if (!parentItem) {
              parentItem = {
                title: parent,
                active: false,
                submenu: []
              };
              items.push(parentItem);
            }
            parentItem.submenu.push(item);
          } else {
            items.push(item);
          }
        }
      });
      return items;
    },
    getMappingElementsJson() {
      var computedTransformers = {
        "mappingElements": []
      };

      this.connections.forEach(conn => {
        if (!this.checkGlobalType(conn.to[0])) return;
        var block = this.blocks[conn.from[0]];
        var blockData = this.blockTemplates[block.type];
        var mappingElement = this.createMappingElement(conn, block, blockData, conn.to[1]);
        var connections = this.connections.filter(childConn => childConn.to[0] === conn.from[0]);
        var argumentSourceMap = this.createArgumentSourceMap(connections);
        if (mappingElement.transformerMapping) {
          mappingElement.transformerMapping.transformer.argumentSourceMap = argumentSourceMap;
          this.updateMappingElementVariables(block, mappingElement.transformerMapping);
        }
        computedTransformers.mappingElements.push(mappingElement);
      });
      return computedTransformers;
    },
    createArgumentSourceMap(connections) {
      var argumentSourceMap = {};
      connections.forEach(conn => {
        var argument = conn.to[1].replace("in ", "");
        if (this.checkGlobalType(conn.from[0])) {
          argumentSourceMap[argument] = "" + this.replaceFromRootName(conn.from[1]);
        } else {
          argumentSourceMap[argument] = this.createFormMappingData(conn);
        }
      });
      return argumentSourceMap;
    },
    replaceFromRootName(text) {
      if(this.replaceFromExpandableNode) {
        var replaceText = this.replaceFromExpandableNode(text);
        if(replaceText != null) {
          return replaceText;
        }
      }
      const rootNodeName = "Variables";
      var reuslt = text;
      if (text.indexOf("roles.") != -1) {
        reuslt = text.replace("roles.roles.", "[roles].");
      } else if (text.indexOf("instance.") != -1) {
        reuslt = text.replace("instance.", "[instance].");
      } else if (text.indexOf("activities.") != -1) {
        this.activities.forEach(activity => {
          reuslt = text.replace("activities.activities." + activity.name, "");
          reuslt = reuslt.replace(activity.name, activity.id);
        });
        reuslt = reuslt.replace("activities.", "[activities].");
      } else {
        reuslt = text.replace(rootNodeName + ".", "");
      }
      return reuslt;
    },
    replaceToRootName(text) {
      if(this.replaceToExpandableNode) {
        var replaceText = this.replaceToExpandableNode(text);
        if(replaceText != null) {
          return replaceText;
        }
      }
      const rootNodeName = "Variables";
      var reuslt = text;
      if (text.indexOf("[roles].") != -1) {
        reuslt = text.replace("[roles].", "roles.roles.");
      } else if (text.indexOf("[instance].") != -1) {
        reuslt = text.replace("[instance].", "instance.");
      } else if (text.indexOf("[activities].") != -1) {
        reuslt = text.replace("[activities].", "activities.");
        this.activities.forEach(activity => {
          reuslt = reuslt.replace(activity.id, activity.name);
        });
      } else {
        reuslt = rootNodeName + "." + text;
      }
      return reuslt;
    },
    createFormMappingData(conn) {
      var block = this.blocks[conn.from[0]];
      var blockData = this.blockTemplates[block.type];
      var transformerMapping = {
        "_type": "org.uengine.processdesigner.mapper.TransformerMapping",
        "transformer": {
          "_type": blockData.class,
          "name": conn.from[0],
          "location": block.pos,
          "argumentSourceMap": {}
        },
        "linkedArgumentName": "out"
      }
      var connections = this.connections.filter(childConn => childConn.to[0] === conn.from[0]);
      var argumentSourceMap = this.createArgumentSourceMap(connections);
      transformerMapping.transformer.argumentSourceMap = argumentSourceMap;
      this.updateMappingElementVariables(block, transformerMapping);
      return transformerMapping;
    },
    checkGlobalType(type) {
      return type == "Source" || type == "Target" || type == "Direct";
    },
    createMappingElement(conn, block, blockData, arg) {
      var mappingElement = {};
      const blockName = conn.from[0];
      var argument = this.replaceFromRootName(arg);
      if (blockName == "Source") {
        mappingElement = {
          "argument": {
            "text": argument
          },
          "direction": "out",
          "variable": {
            "name": this.replaceFromRootName(conn.from[1]),
            "askWhenInit": false,
            "isVolatile": false
          },
          "isKey": false
        }
      } else {
        mappingElement = {
          "argument": {
            "text": argument
          },
          "direction": "out",
          "transformerMapping": {
            "transformer": {
              "_type": blockData.class,
              "name": blockName,
              "location": block.pos,
              "argumentSourceMap": {}
            },
            "linkedArgumentName": argument
          },
          "isKey": false
        };

      }
      return mappingElement;
    },
    updateMappingElementVariables(block, transformerMapping) {
      Object.keys(block.attributes).forEach(key => {
        var value = block.attributes[key];
        if (value == undefined) value = "";
        transformerMapping.transformer[key] = value;
      });
    },
    renderFormMapperFromMappingElementJson(json) {
      if (!json) {
        return;
      }
      try {
        const mappingContent = JSON.parse(json);

        mappingContent.mappingElements.forEach(element => {
          this.createMappingElementFromJson(element);
        });

        this.connections = this.tempConnections;
      } catch (error) {
        console.error("JSON 파싱 중 오류가 발생했습니다:", error);
      }
    },
    createMappingElementFromJson(element) {
      var transformerMapping = element.transformerMapping;

      if (transformerMapping) {
        this.addBlockFromJson(transformerMapping, element.argument.text);
      } else {
        this.addConnectionDirect(element.variable.name, element.argument.text);
      }
    },
    addBlockFromJson(transformerMapping, targetArgument = null) {
      var blockName = transformerMapping.transformer.name;
      var transformerType = transformerMapping.transformer._type;
      var filteredEntries = Object.entries(this.blockTemplates).filter(([key, block]) => block.class === transformerType);
      var keyOfMatchingBlock = filteredEntries.length > 0 ? filteredEntries[0][0] : undefined;

      var newBlock = {
        type: keyOfMatchingBlock,
        pos: transformerMapping.transformer.location,
        attributes: {},
      };

      Object.keys(transformerMapping.transformer.argumentSourceMap).forEach(key => {
        var argumentSourceMap = transformerMapping.transformer.argumentSourceMap[key];
        if (argumentSourceMap != null && typeof argumentSourceMap === 'object') {
          this.addBlockFromJson(argumentSourceMap);
        }
      });

      this.addAttributeFromJson(newBlock, transformerMapping);


      if (transformerMapping.transformer.argumentSourceMap) {
        this.addConnectionJson(blockName, "Target", transformerMapping.transformer.argumentSourceMap, targetArgument);
      }

      this.blocks[blockName] = newBlock;
    },
    addAttributeFromJson(block, transformerMapping) {
      var attributeTemplate = this.blockTemplates[block.type].attributes;
      if (attributeTemplate != undefined) {
        Object.keys(attributeTemplate).forEach(key => {
          block.attributes[key] = transformerMapping.transformer[key];
        });
      }
    },
    addConnectionJson(fromBlockName, toBlockName, argumentSourceMap, targetArgument = null) {
      Object.entries(argumentSourceMap).forEach(([argument, source]) => {
        let connection;
        if (typeof source === 'object' && source.transformer) {
          const sourceBlockName = source.transformer.name;
          this.addConnectionJson(sourceBlockName, fromBlockName, source.transformer.argumentSourceMap);
          connection = {
            from: [sourceBlockName, "out"],
            to: [fromBlockName, "in " + argument],
          };
        } else {
          connection = {
            from: ["Source", this.replaceToRootName(source)],
            to: [fromBlockName, "in " + argument],
          };
        }
        if (!this.isConnectionDuplicate(connection)) {
          this.tempConnections.push(connection);
        }
      });

      if (toBlockName === "Target" && targetArgument) {
        const connection = {
          from: [fromBlockName, "out"],
          to: ["Target", this.replaceToRootName(targetArgument)],
        };
        if (!this.isConnectionDuplicate(connection)) {
          this.tempConnections.push(connection);
        }
      }
    },
    addConnectionDirect(variable, targetArgument) {
      const connection = {
        from: ["Source", this.replaceToRootName(variable)],
        to: ["Target", this.replaceToRootName(targetArgument)],
      };
      if (!this.isConnectionDuplicate(connection)) {
        this.tempConnections.push(connection);
      }
    },
    isConnectionDuplicate(connection) {
      return this.tempConnections.some(conn =>
        conn.from[0] === connection.from[0] && conn.from[1] === connection.from[1] &&
        conn.to[0] === connection.to[0] && conn.to[1] === connection.to[1]);
    },
  },
  computed: {
    offset() {
      return { x: $("#formArea")[0].getBoundingClientRect().x, y: $("#formArea")[0].getBoundingClientRect().y };
    },
    transform() {
      return `translate(${d(this.offset)})`;
    },
    blocks_() {
      return _.map(this.blocks, (block, name) => this.getBlock(name));
    },
    connectors() {
      return this.connections.map(({ from, to, isNew }) => {
        return {
          from,
          to,
          isNew,
          startPos: this.resolvePos(from),
          endPos: this.resolvePos(to),
        };
      });
    },
    ports() {
      return _.flatMap(this.blocks, ({ type, pos }, blockName) => {
        const template = this.blockTemplates[type];
        var portsTemp = _.map(template.ports, (port, name) => ({
          ...port,
          direction: port.direction || "in",
          name,
          blockName,
          pos: add(pos, port),
        }));
        return portsTemp;
      });
    },
    attributes_() {
      return _.flatMap(this.blocks, ({ type, pos }, blockName) => {
        const template = this.blockTemplates[type];
        var result = _.map(template.attributes, (attribute, name) => ({
          ...attribute,
          func: attribute.func,
          name,
          value: attribute.value,
          blockName,
          pos: add(pos, attribute),
        }));
        if (result.length > 0 && this.blocks) {
          if (this.blocks[blockName].attributes) {
            result.forEach(attr => {
              attr.value = this.blocks[blockName].attributes[attr.name];
            });
          }
        }
        return result;
      });
    },
  },
};