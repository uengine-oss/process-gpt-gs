import { createStore } from 'vuex';

export default createStore({
    state: {
        messages: null,
        editMessages: null
    },
    mutations: {
        setMessages(state, messages) {
            state.messages = messages;
        },
        setEditMessages(state, editMessages) {
            state.editMessages = editMessages;
        },
        clearMessages(state) {
            state.messages = null;  // or state.messages = [] if you prefer to reset to an empty array
            state.editMessages = null;  // or state.messages = [] if you prefer to reset to an empty array
        }
    },
    actions: {
        updateMessages({ commit }, messages) {
            commit('setMessages', messages);
        },
        updateEditMessages({ commit }, editMessages) {
            commit('setEditMessages', editMessages);
        }
    }
});