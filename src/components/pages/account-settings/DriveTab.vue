<template>
    <div class="ma-0 pa-4">
        <!-- <h4 class="text-h4">{{ $t('accountTab.drive') }}</h4> -->
        <div class="mt-6">
            <v-label class="mb-2 font-weight-medium">{{ $t('accountTab.clientId') }}</v-label>
            <v-text-field color="primary" variant="outlined" type="text" v-model="driveInfo.client_id" hide-details :disabled="!isEditMode"></v-text-field>
        </div>
        <div class="mt-6">
            <v-label class="mb-2 font-weight-medium">{{ $t('accountTab.clientSecret') }}</v-label>
            <v-text-field color="primary" variant="outlined" type="password" v-model="driveInfo.client_secret" hide-details :disabled="!isEditMode"></v-text-field>
        </div>
        <div class="mt-6">
            <v-label class="mb-2 font-weight-medium">Redirect URI</v-label>
            <v-text-field color="primary" variant="outlined" type="text" v-model="driveInfo.redirect_uri" hide-details :disabled="!isEditMode"></v-text-field>
        </div>
        <div class="mt-6">
            <v-label class="mb-2 font-weight-medium">{{ $t('accountTab.folderId') }}</v-label>
            <v-text-field color="primary" variant="outlined" type="text" v-model="driveInfo.drive_folder_id" hide-details :disabled="!isEditMode"></v-text-field>
        </div>
    </div>

    <v-row class="ma-0 pa-4 pt-0">
        <v-spacer></v-spacer>
        <div v-if="isEditMode">
            <v-btn @click="isEditMode = false"
                color="grey"
                variant="elevated"
                class="rounded-pill mr-2"
            >{{ $t('accountTab.cancel') }}</v-btn>
            <v-btn @click="saveDriveInfo"
                color="primary"
                variant="elevated"
                class="rounded-pill"
            >{{ $t('accountTab.save') }}</v-btn>
        </div>
        <v-btn v-else @click="isEditMode = true"
            color="primary"
            variant="elevated"
            class="rounded-pill"
        >{{ $t('accountTab.edit') }}</v-btn>
    </v-row>
</template>

<script>
import BackendFactory from '@/components/api/BackendFactory';
const backend = BackendFactory.createBackend();

export default {
    data: () => ({
        isEditMode: false,
        driveInfo: {
            tenant_id: `${window.$tenantName}`,
            client_id: '',
            client_secret: '',
            drive_folder_id: '',
            redirect_uri: '',
        },
    }),
    watch: {
        '$route.query': {
            handler(newVal) {
                if (newVal.code && newVal.state && newVal.scope) {
                    this.getOAuth();
                }
            },
        },
    },
    async mounted() {
        const value = await backend.getDriveInfo();
        if (value) {
            this.driveInfo = value;
        }

        if (this.$route.query.code && this.$route.query.state && this.$route.query.scope) {
            await this.getOAuth();
        }
    },
    methods: {
        async getOAuth() {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const code = urlParams.get('code');
                const state = urlParams.get('state');
                const scope = urlParams.get('scope');
                const email = this.userInfo.email;

                const response = await fetch('/memento/auth/google/callback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code, state, scope, user_email: email })
                });
                const result = await response.json();
                if (result.success) {
                    this.$route.query = {}
                }
            } catch (error) {
                console.error('OAuth 실패:', error);
            }
        },
        saveDriveInfo() {
            var me = this;
            me.$try({
                action: async () => {
                    await backend.saveDriveInfo(this.driveInfo);
                    this.driveInfo = await backend.getDriveInfo();
                    this.isEditMode = false;
                },
                successMsg: "구글 드라이브 연동 정보가 저장되었습니다."
            });
        }
    }
};
</script>
