<template>
    <div v-if="systemInfo">
        <v-card elevation="10"
            style="height:200px;"
        >
            <v-row class="pa-4 ma-0">
                <v-card-title class="pa-0 ma-0">
                    {{ systemInfo.name }}
                </v-card-title>
                <v-spacer></v-spacer>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn v-bind="props" icon variant="text" type="file" class="text-medium-emphasis" 
                            density="comfortable" @click="showDeleteDialog = true"
                        >
                            <TrashIcon size="24" style="color:#FB977D"/>
                        </v-btn>
                    </template>
                    <span>{{ $t('processDefinition.deleteProcess') }}</span>
                </v-tooltip>
            </v-row>
            <v-card-text class="pa-0 pl-4">
                {{ $t('System.description') }}: {{ systemInfo.description }}
                <br>
                URL: {{ systemInfo.url }}
            </v-card-text>
            <v-btn @click="editSystem"
                color="primary"
                rounded
                style="position: absolute;
                bottom:10px; right:10px;"
            >
            {{ $t('System.edit') }}
            </v-btn>
        </v-card>
        <!-- 삭제 확인 다이얼로그 -->
        <v-dialog v-model="showDeleteDialog" max-width="400">
            <v-card class="pa-4">
                <v-row class="pa-0 ma-0 pb-4">
                    <v-card-title class="pa-0">{{ $t('System.confirmDeleteTitle') }}</v-card-title>
                    <v-spacer></v-spacer>
                    <v-btn @click="showDeleteDialog = false" icon variant="text" density="comfortable" size="24">
                        <Icons :icon="'close'" :size="16" />
                    </v-btn>
                </v-row>
                <v-card-text class="pa-0 pb-4">
                    {{ systemInfo.name }}{{ $t('System.confirmDeleteText') }}
                </v-card-text>
                <v-row class="pa-0 ma-0">
                    <v-spacer></v-spacer>
                    <v-btn color="error" rounded @click="deleteSystem">{{ $t('System.delete') }}</v-btn>
                </v-row>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import BackendFactory from '@/components/api/BackendFactory';
const backend = BackendFactory.createBackend();

export default {
    name: 'system-list',
    props: {
        system: {
            type: String,
            required: true
        }
    },
    data: () => ({
        systemInfo: null,
        showDeleteDialog: false
    }),
    async created() {
        let me = this
        this.systemInfo = await backend.getSystem(me.system.replace(".json", ""));
    },
    mounted() {},
    computed: {},
    methods: {
        editSystem() {
            this.$emit("editSystem", this.systemInfo);
        },
        async deleteSystem() {
            var me = this;
            me.$try({
                context: me,
                action: async () => {
                    await backend.deleteSystem(this.systemInfo);
                    this.$emit("systemDeleted");
                    this.showDeleteDialog = false;
                },
                successMsg: this.$t('successMsg.delete')
            });
        }
    }
};
</script>
