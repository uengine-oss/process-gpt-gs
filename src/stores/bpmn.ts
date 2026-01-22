import { defineStore } from 'pinia';

export const useBpmnStore = defineStore({
    id: 'bpmn',
    state: () => ({
        bpmnModeler: null,
        processDefinition: null
      }),
    actions: {
        setModeler(modeler: any) {
            this.bpmnModeler = modeler
        },
        setProcessDefinition(definition: any) {
            this.processDefinition = definition
        }
    },
    getters: {
        getModeler: state => {
            return state.bpmnModeler;
        },
        // getXML: async state => {
        //     if (state.bpmnModeler && typeof state.bpmnModeler?.saveXML === 'function') {
                
        //     }
        // }
    }
});
