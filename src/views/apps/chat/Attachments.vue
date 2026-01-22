<template>
    <div class="px-6 attachments-box" v-if="isOpen">
        <h6 class="text-h6">Attachments</h6>
        <v-sheet>
            <div v-if="attachments.length > 0">
                <div class="mt-3 cursor-pointer" v-for="attachment in attachments" :key="attachment.id">
                    <div class="d-flex align-center" @click="downloadAttachment(attachment.file_path)">
                        <v-avatar class="rounded-md bg-lightsecondary" size="48">
                            <v-icon>mdi-file</v-icon>
                        </v-avatar>
                        <div class="pl-4">
                            <h6 class="text-subtitle-1 font-weight-semibold">{{ attachment.file_name }}</h6>
                            <h5 class="text-subtitle-2 mt-1">{{ attachment.user_name }}</h5>
                        </div>
                    </div>
                </div>
            </div>
        </v-sheet>
    </div>
</template>

<script>
export default {
    name: 'Attachments',
    props: {
        isOpen: {
            type: Boolean,
            default: false
        },
        attachments: {
            type: Array,
            default: []
        }
    },
    data() {
        return {
        }
    },
    methods: {
        downloadAttachment(file_path) {
            window.open(file_path, '_blank');
        }
    }
}
</script>

<style scoped>
.attachments-box {
    background-color: white;
    padding-top: 12px;
    padding-bottom: 15px;
    border-radius: 12px;
}
</style>