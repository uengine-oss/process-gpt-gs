<template>
    <Form @submit="processTenantSignup" v-slot="{ errors, isSubmitting }" class="mt-5">
        <v-label class="text-subtitle-1 font-weight-medium pb-2">
            {{ $t('createAccount.tenantRegister') }}
        </v-label>
        <v-divider class="mb-4" />       
       
        <!-- #region 테넌트 가입 정보 입력 -->
        <v-label class="text-subtitle-1 font-weight-medium pb-2">{{ $t('createAccount.userName') }}</v-label>
        <VTextField 
            v-model="accountInfo.username" 
            :rules="accountInfoRules.username" 
            required 
        ></VTextField>

        <v-label class="text-subtitle-1 font-weight-medium pb-2">{{ $t('createAccount.email') }}</v-label>
        <VTextField 
            v-model="accountInfo.email" 
            :rules="accountInfoRules.email" 
            required 
        ></VTextField>

        <v-label class="text-subtitle-1 font-weight-medium pb-2">{{ $t('createAccount.password') }}</v-label>
        <VTextField
            v-model="accountInfo.password"
            :counter="10"
            :rules="accountInfoRules.password"
            required
            variant="outlined"
            type="password"
            color="primary"
        ></VTextField>
        <!-- #endregion -->

        <v-btn 
            size="large" 
            class="mt-2" 
            color="primary" 
            block 
            rounded="pill"
            :loading="isSubmitting"
            type="submit"
        >Sign up</v-btn>
    </Form>
</template>

<script>
import { Form } from 'vee-validate';
import { useAuthStore } from '@/stores/auth';
import { getCurrentInstance } from 'vue';

export default {
    name: 'TenantRegisterForm',
    components: {
        Form
    },

    data: () => ({
        accountInfo: {
            username: '',
            email: '',
            password: ''
        },
        accountInfoRules: {
            username: [
                (v) => !!v || 'Name is required',
                (v) => (v && v.length <= 10) || 'Name must be less than 10 characters'
            ],
            email: [(v) => !!v || 'E-mail is required', (v) => /.+@.+\..+/.test(v) || 'E-mail must be valid'],
            password: [
                (v) => !!v || 'Password is required',
            ],
        }
    }),

    methods: {
        async processTenantSignup() {
            const { proxy } = getCurrentInstance();
            let me = this;
            me.$try({
                context: me,
                action: async () => {
                    await me.authStore.signUp(me.accountInfo.username, me.accountInfo.email, me.accountInfo.password, proxy);
                }
            });
        }
    },

    created() {
        this.authStore = useAuthStore();
    }
};
</script>