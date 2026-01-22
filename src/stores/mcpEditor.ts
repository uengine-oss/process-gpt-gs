import { defineStore } from 'pinia';

export const useMcpEditorStore = defineStore('mcpEditor', {
    state: () => ({
        editingKey: null as string | null,
        mcpJsonText: '',
        newJsonText: '',
        isAddMode: false
    }),
    actions: {
        setEditingState(key: string, jsonText: string) {
            this.editingKey = key;
            this.mcpJsonText = jsonText;
            this.isAddMode = false;
        },
        setAddMode(jsonText: string) {
            this.editingKey = null;
            this.newJsonText = jsonText;
            this.isAddMode = true;
        },
        updateMcpJsonText(text: string) {
            this.mcpJsonText = text;
        },
        updateNewJsonText(text: string) {
            this.newJsonText = text;
        },
        clearEditingState() {
            this.editingKey = null;
            this.mcpJsonText = '';
            this.newJsonText = '';
            this.isAddMode = false;
        }
    }
});

