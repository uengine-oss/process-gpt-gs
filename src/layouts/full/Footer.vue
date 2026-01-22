<template>
    <v-container class="ma-0 pa-0">
        <v-divider></v-divider>
        <div class="footer-content ma-0 pa-3 text-center">
            <!-- Copyright -->
            <div class="mb-2 text-caption text-medium-emphasis">
                Copyright © uEngine Solutions.<br>All Rights Reserved
            </div>
            
            <!-- 회사 정보 -->
            <div class="mb-2 text-caption text-medium-emphasis">
                <div class="mb-1"><span v-html="$t('footer.BusinessNumber')"></span>211-87-95355<br>{{ $t('footer.CEO') }}</div>
                <div class="mb-1">{{ $t('footer.Address1') }}<br>{{ $t('footer.Address2') }}</div>
                <div>{{ $t('footer.tel') }} 02-567-8301</div>
            </div>
            
            <!-- 약관 링크 -->
            <div class="d-flex justify-center gap-3 text-caption">
                <a @click="showTermsDialog = true" class="text-decoration-none text-primary cursor-pointer">{{ $t('footer.serviceTerms') }}</a>
                <span class="text-medium-emphasis">|</span>
                <a @click="showPrivacyDialog = true" class="text-decoration-none text-primary cursor-pointer">{{ $t('footer.privacyPolicy') }}</a>
            </div>
        </div>

        <!-- 서비스 이용약관 다이얼로그 -->
        <v-dialog v-model="showTermsDialog" max-width="800px" scrollable>
            <v-card>
                <v-row class="ma-0 pa-4 align-center">
                    <v-card-title class="pa-0">{{ $t('footer.serviceTerms') }}</v-card-title>
                    <v-spacer></v-spacer>
                    <v-btn @click="closeDialog"
                        class="ml-auto" 
                        variant="text" 
                        density="compact"
                        icon
                    >
                        <v-icon @click="showTermsDialog = false">mdi-close</v-icon>
                    </v-btn>
                </v-row>
                <v-divider></v-divider>
                <v-card-text class="pa-4" style="max-height: 70vh;">
                    <Terms />
                </v-card-text>
            </v-card>
        </v-dialog>

        <!-- 개인정보처리방침 다이얼로그 -->
        <v-dialog v-model="showPrivacyDialog" max-width="800px" scrollable>
            <v-card>
                <v-row class="ma-0 pa-4 align-center">
                    <v-card-title class="pa-0">{{ $t('footer.privacyPolicy') }}</v-card-title>
                    <v-spacer></v-spacer>
                    <v-btn @click="closeDialog"
                        class="ml-auto" 
                        variant="text" 
                        density="compact"
                        icon
                    >
                        <v-icon @click="showPrivacyDialog = false">mdi-close</v-icon>
                    </v-btn>
                </v-row>
                <v-divider></v-divider>
                <v-card-text class="pa-4" style="max-height: 70vh;">
                    <Privacy />
                </v-card-text>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script setup>
import { ref } from 'vue'
import Terms from '@/views/pages/term-policy/Terms.vue'
import Privacy from '@/views/pages/term-policy/Privacy.vue'

const showTermsDialog = ref(false)
const showPrivacyDialog = ref(false)
</script>
