import { defineStore } from 'pinia';

export const useDmnStore = defineStore({
    id: 'dmn',
    state: () => ({
        dmnModeler: null,
        decisionDefinition: null
    }),
    actions: {
        setModeler(modeler: any) {
            this.dmnModeler = modeler;
        },
        setDecisionDefinition(definition: any) {
            this.decisionDefinition = definition;
        }
    },
    getters: {
        getModeler: state => {
            return state.dmnModeler;
        },
        getDefinition: state => {
            return state.decisionDefinition;
        }
    }
});

