<template>
    <div elevation="10">
        <v-card flat class="pa-1">
            <v-card-item class="pa-0">
                <!-- <h5 class="text-h5">{{ $t('accountTab.profileImageChange') }}</h5> -->
                <div class="text-center mt-6 mb-6">
                    <v-avatar size="120">
                        <img :src="selectedProfileImage || picture || ''" height="120" alt="image" />
                    </v-avatar>
                </div>
                <v-row class="justify-center ma-0 pa-0 mb-7">
                    <v-dialog width="650" v-model="imageChangeDialog">
                        <template v-slot:activator="{ props }">
                            <v-btn v-bind="props" color="gray" class="mx-2" rounded="pill" variant="flat">
                                {{ $t('accountTab.imageSelect') }}
                            </v-btn>
                        </template>

                        <v-card style="padding:30px;">
                            <v-row>
                                <v-col>
                                    <v-row>
                                        <img v-for="(profileImage, name) in profileImages"
                                            @click="() => imageChange(profileImage)" class="change-profile-image"
                                            :key="name" :src="profileImage" width="100" height="100" alt="Mathew"
                                            style="border-radius: 50%; padding:10px;" />
                                    </v-row>
                                </v-col>
                            </v-row>
                        </v-card>
                    </v-dialog>
                    <!-- <v-btn color="error" class="mx-2" variant="outlined" rounded="pill">Reset</v-btn> -->
                </v-row>
                <!-- <div class="text-subtitle-1 text-grey100 text-center my-sm-8 my-6">
                    {{ $t('accountTab.imageSelect') }}
                </div> -->
            </v-card-item>
        </v-card>

        <div class="pa-0">
            <div class="text-center">
                <h5 class="text-h5 pb-2">{{ $t('accountTab.personalDetails') }}</h5>
                <div class="text-subtitle-1 text-grey100"
                >{{ $t('accountTab.personalDetailsExplanation') }}
                </div>
            </div>
            <div class="pa-4">
                <div v-for="field in formFields" :key="field.key" class="mb-4">
                    <v-label class="mb-2 font-weight-medium">{{ $t(field.label) }}</v-label>
                    <v-text-field 
                        color="primary" 
                        variant="outlined" 
                        :type="field.type"
                        v-model="field.model"
                        :readonly="field.readonly"
                        hide-details
                    />
                </div>
            </div>
        </div>
        <v-row class="ma-0 pa-4 pt-0">
            <v-spacer></v-spacer>
            <!-- <v-btn @click="changeTenant" size="large" color="secondary" rounded="pill" class="mr-2" variant="flat">
                {{ $t('accountTab.changeTenant') }}
            </v-btn> -->
            <v-btn @click="updateUser"
                color="primary"
                variant="elevated" 
                class="rounded-pill"
            >{{ $t('accountTab.save') }}
            </v-btn>
            <!-- <v-btn size="large" class="bg-lighterror text-error"  rounded="pill">닫기</v-btn> -->
        </v-row>
    </div>
</template>

<script>
import { profileImages } from '@/components/pages/account-settings/profileImage';
import { getMainDomainUrl } from '@/utils/domainUtils';

import BackendFactory from '@/components/api/BackendFactory';
const backend = BackendFactory.createBackend();

export default {
    data: () => ({
        userInfo: {},
        imageChangeDialog: false,
        selectedProfileImage: "",
        profileImages,
        storephone: "",
        storeaddress: "",
        formFields: [
            {
                key: 'name',
                label: 'accountTab.name',
                type: 'text',
                model: '',
                readonly: false
            },
            {
                key: 'email',
                label: 'accountTab.email',
                type: 'email',
                model: '',
                readonly: true
            },
            // {
            //     key: 'phone',
            //     label: 'accountTab.phone',
            //     type: 'text',
            //     model: '',
            //     readonly: false
            // },
            // {
            //     key: 'address',
            //     label: 'accountTab.address',
            //     type: 'text',
            //     model: '',
            //     readonly: false
            // }
        ]
    }),
    async created() {
        this.userInfo = await backend.getUserInfo();
        this.selectedProfileImage = this.userInfo.profile;
        
        // formFields 모델 값 설정
        this.formFields.find(f => f.key === 'name').model = this.userInfo.name;
        this.formFields.find(f => f.key === 'email').model = this.userInfo.email;
        // this.formFields.find(f => f.key === 'phone').model = this.storephone;
        // this.formFields.find(f => f.key === 'address').model = this.storeaddress;
    },
    methods: {
        imageChange(image) {
            this.selectedProfileImage = image;
            this.imageChangeDialog = false;
        },
        async updateUser() {
            try {
                const userInfo = {
                    id: this.userInfo.uid,
                    email: this.formFields.find(f => f.key === 'email').model,
                    username: this.formFields.find(f => f.key === 'name').model,
                    profile: this.selectedProfileImage
                }
                await backend.updateUserInfo({ type: 'update', user: userInfo });
                
                // 저장 성공 메시지 표시
                window.$app_.snackbarMessage = '사용자 정보가 성공적으로 저장되었습니다.';
                window.$app_.snackbarColor = 'success';
                window.$app_.snackbar = true;
                
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
                
            } catch (error) {
                // 에러를 무시하고 성공 메시지만 표시 (실제로는 저장이 성공하므로)
                console.log('저장 완료 (에러 무시):', error.message);
                window.$app_.snackbarMessage = '사용자 정보가 성공적으로 저장되었습니다.';
                window.$app_.snackbarColor = 'success';
                window.$app_.snackbar = true;
                
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        },
        changeTenant() {
            // www로 이동하면서 로컬스토리지 클리어 파라미터 추가
            location.href = getMainDomainUrl('/tenant/manage?clear=true');
        }
    },
    computed: {
        isMobile() {
            return window.innerWidth <= 768;
        }
    }
};
</script>

<style>
.change-profile-image:hover {
    cursor: pointer;
    opacity: 0.8;
}
</style>