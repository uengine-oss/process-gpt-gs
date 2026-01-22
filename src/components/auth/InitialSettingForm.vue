<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';

const username = ref(localStorage.getItem('userName') || localStorage.getItem('email')?.split('@')[0] || '');
const password = ref('');
const confirmPassword = ref('');
const isLoading = ref(false);

const usernameRules = ref([
    (v: string) => !!v || '사용자명은 필수입니다',
    (v: string) => v.length >= 3 || '사용자명은 최소 3자 이상이어야 합니다',
    (v: string) => /^[a-zA-Z0-9가-힣_]+$/.test(v) || '사용자명은 영문, 한글, 숫자, 언더스코어만 사용 가능합니다',
]);

const passwordRules = ref([
    (v: string) => !!v || '비밀번호는 필수입니다',
    (v: string) => v.length >= 8 || '비밀번호는 최소 8자 이상이어야 합니다',
]);

const confirmPasswordRules = ref([
    (v: string) => !!v || '비밀번호 확인은 필수입니다',
    (v: string) => v === password.value || '비밀번호가 일치하지 않습니다',
]);

// TODO: 실제 사용자 ID를 가져오는 로직 구현 필요
// 예: URL 파라미터, 로컬 스토리지, 또는 다른 방법으로 사용자 ID 획득
const getUserId = () => {
    // 임시로 하드코딩된 UUID 반환
    // 실제 구현에서는 적절한 방법으로 사용자 ID를 가져와야 함
    return localStorage.getItem('uid');
};

async function setInitialSettings() {
    if (password.value !== confirmPassword.value) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
    }

    isLoading.value = true;
    
    try {
        const response = await axios.post('/completion/set-initial-info', {
            input: {
                user_id: getUserId(),
                user_name: username.value,
                password: password.value
            }
        });
        
        // 성공 처리
        alert('초기 설정이 성공적으로 완료되었습니다. 로그인 후 이용 가능합니다.');
        window.location.href = '/auth/login';
        
    } catch (error) {
        console.error('초기 설정 실패:', error);
        alert('초기 설정에 실패했습니다. 다시 시도해주세요.');
    } finally {
        isLoading.value = false;
    }
}
</script>

<template>
    <div>
        <v-form ref="form" @submit.prevent="setInitialSettings" lazy-validation class="mt-sm-13 mt-8">
            <v-label class="text-subtitle-1 font-weight-medium pb-2 text-lightText">사용자명</v-label>
            <VTextField 
                v-model="username" 
                :rules="usernameRules" 
                required 
                type="text"
                placeholder="사용하실 사용자명을 입력하세요"
            ></VTextField>
            
            <v-label class="text-subtitle-1 font-weight-medium pb-2 text-lightText mt-4">새 비밀번호</v-label>
            <VTextField 
                v-model="password" 
                :rules="passwordRules" 
                required 
                type="password"
                placeholder="새 비밀번호를 입력하세요"
            ></VTextField>
            
            <v-label class="text-subtitle-1 font-weight-medium pb-2 text-lightText mt-4">비밀번호 확인</v-label>
            <VTextField 
                v-model="confirmPassword" 
                :rules="confirmPasswordRules" 
                required 
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
            ></VTextField>
            
            <v-btn 
                size="large" 
                color="primary" 
                block 
                type="submit" 
                rounded="pill" 
                class="mt-6"
                :loading="isLoading"
                :disabled="isLoading"
            >
                초기 설정 완료
            </v-btn>
        </v-form>
    </div>
</template> 