<template>
    <div v-if="inputItems.length > 0" class="input-group" style="width: 100%; margin-top:5px;">
        <div v-for="item in inputItems" :key="item.key" class="pa-1">
            <div v-if="Array.isArray(item.value)">
                <v-card variant="outlined" class="pa-2">
                    <v-row class="ma-0 pa-0">
                        <v-card-title class="ma-0 pa-0">{{item.key}}</v-card-title>
                        <v-spacer></v-spacer>
                        <v-btn @click="addSubItem(item)"
                            color="primary"
                            variant="text"
                            icon
                            density="comfortable"
                        >
                            <Icons :icon="'plus'" :size="20" />
                        </v-btn>
                    </v-row>
                    <div style="height:60vh; overflow-y:auto;">
                        <template v-for="(subItem, index) in item.value" :key="index">
                            <div class="d-flex align-center mt-2">
                                <v-text-field
                                    v-model="item.value[index]"
                                    :disabled="isComplete"
                                    hide-details
                                    class="flex-grow-1 mr-2"
                                    outlined
                                ></v-text-field>
                                <v-btn @click="deleteSubItem(item, index)"
                                    class="ml-auto"
                                    icon variant="text" 
                                    density="comfortable"
                                >
                                    <Icons :icon="'trash'" />
                                </v-btn>
                            </div>
                        </template>
                    </div>
                </v-card>
            </div>
            <v-text-field
                v-else
                v-model="item.value"
                :label="item.key"
                :disabled="isComplete"
                hide-details
            ></v-text-field>
        </div>
    </div>
    <div v-else>
        <div class="d-flex justify-center">
            <v-subheader class="text-center">No input fields available</v-subheader>
        </div>
    </div>
</template>

<script>
export default {
    props:{
        inputItems: {
            type: Array,
            default: function () {
                return []
            },
        },
        isComplete: Boolean,
    },
    methods: {
        addSubItem(item) {
            item.value.push('');
        },
        deleteSubItem(item, index) {
            item.value.splice(index, 1);
        }
    }
}
</script>

