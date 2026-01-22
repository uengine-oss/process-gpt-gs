<script setup lang="ts">
import { Form } from 'vee-validate';
import { ref, onMounted, onBeforeUnmount } from 'vue';

import { useAuthStore } from '@/stores/auth';
const authStore = useAuthStore();
const checkbox = ref(false);
const password = ref('');
const showPassword = ref(false);
const isCapsLockOn = ref(false);

// localStorage에서 이메일을 가져오고, 없으면 빈 문자열로 설정
const storedEmail = localStorage.getItem('email') || '';
const username = ref(storedEmail);

const passwordRules = ref([
    (v: string) => !!v || 'Password is required',
]);
const emailRules = ref([(v: string) => !!v || 'E-mail is required', (v: string) => /.+@.+\..+/.test(v) || 'E-mail must be valid']);

function validate(values: any, { setErrors }: any) {
    return authStore.signIn(username.value.toLowerCase(), password.value);
}

function checkCapsLock(event: KeyboardEvent | FocusEvent) {
    if ('getModifierState' in event) {
        isCapsLockOn.value = event.getModifierState('CapsLock');
    }
}

// 컴포넌트 마운트 시 전역 이벤트 리스너 추가
onMounted(() => {
    
});

// 컴포넌트 언마운트 시 리스너 제거
onBeforeUnmount(() => {
    
});
</script>

<template>
    <Form @submit="validate" v-slot="{ errors, isSubmitting }" class="mt-5">
        <v-label class="text-subtitle-1 font-weight-semibold pb-2 text-grey200">{{ $t('loginPage.userName') }}</v-label>
        <VTextField
            v-model="username"
            :rules="emailRules"
            class="mb-8 cp-id"
            required
            hide-details="auto"
        ></VTextField>
        <v-label class="text-subtitle-1 font-weight-semibold pb-2 text-grey200">{{ $t('loginPage.password') }}</v-label>
        <div class="position-relative">
            <VTextField
                v-model="password"
                :rules="passwordRules"
                required
                hide-details="auto"
                :type="showPassword ? 'text' : 'password'"
                class="pwdInput cp-pwd"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
                @keydown="checkCapsLock"
                @keyup="checkCapsLock"
                @focus="checkCapsLock"
                style="background: #E8F0FE;"
            ></VTextField>
            <div v-if="isCapsLockOn" class="caps-lock-warning">
                <v-chip size="small" color="warning" class="mt-1">
                    <v-icon size="small" class="mr-1">mdi-lock-alert</v-icon>
                    Caps Lock이 켜져있습니다
                </v-chip>
            </div>
        </div>
        <div :class="['d-flex', 'flex-wrap', 'align-center', 'my-3', 'ml-n2', { 'mt-6': isCapsLockOn }]">
            <v-checkbox v-model="checkbox" :rules="[(v:any) => !!v || 'You must agree to continue!']" required hide-details color="primary">
                <template v-slot:label>{{ $t('loginPage.remeber') }}</template>
            </v-checkbox>
        </div>
        <v-btn class="cp-login" size="large" rounded="pill" :loading="isSubmitting" color="primary" block type="submit" flat>{{ $t('loginPage.login') }}</v-btn>
        <div v-if="errors.apiError" class="mt-2">
            <v-alert color="error">{{ errors.apiError }}</v-alert>
        </div>
    </Form>
</template>

<style scoped>
.caps-lock-warning {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 1;
}
</style>